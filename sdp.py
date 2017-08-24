# SDP: Subscription Data Protocol

import tornado
import tornado.ioloop
import tornado.websocket
from tornado.queues import Queue
import time
# import ejson
import rethinkdb as r
from tornado import gen
import json
from datetime import datetime
import pytz

r.set_loop_type("tornado")
#https://www.rethinkdb.com/docs/async-connections/
sessions = {}

methods = []


def method(f):
    methods.append(f.__name__)
    return gen.coroutine(f)

subs = []


def sub(f):
    subs.append(f.__name__)
    return f

hooks = {'before_insert': [],
         'before_update': []
         }

def before_insert(collection=None):
  def decorator(f):
    def helper(self, coll, doc):
      if collection == coll or collection is None:
        f(self, doc)
    hooks['before_insert'].append(helper)
    return f # does not matter, it's not going to be used directly, but helper in hooks
  return decorator

def before_update(collection=None):
  def decorator(f):
    def helper(self, coll, doc):
      if collection == coll or collection is None:
        f(self, doc)
    hooks['before_update'].append(helper)
    return f # does not matter, it's not going to be used directly, but helper in hooks
  return decorator


class MethodError(Exception):
  pass

class CheckError(Exception):
  pass

can = {'update': [], 'insert': [], 'delete': []}

def can_insert(table):
    def decorate(f):
        def helper(self, t, doc):
            if t == table:
                return f(self, doc)
            else:
                return True
        can['insert'].append(helper)
        return f # does not matter f or helper, it's not going to be used directly
    return decorate

def can_update(table):
    def decorate(f):
        def helper(self, t, doc, old_doc):
            if t == table:
                return f(self, doc, old_doc)
            else:
                return True
        can['update'].append(helper)
        return f # does not matter f or helper, it's not going to be used directly
    return decorate

def can_delete(table):
    def decorate(f):
        def helper(self, t, old_doc):
            if t == table:
                return f(self, old_doc)
            else:
                return True
        can['delete'].append(helper)
        return f # does not matter f or helper, it's not going to be used directly
    return decorate

class SDP(tornado.websocket.WebSocketHandler):

    def __init__(self, application, request):
        super().__init__(application, request)
        self.conn = r.connect(host='localhost', port=28015, db='test')
        self.session = time.time()
        sessions[self.session] = self
        self.registered_feeds = {}
        self.pending_unsubs = []
        self.queue = Queue(maxsize=10)
        self.user_id = None
        tornado.ioloop.IOLoop.current().spawn_callback(self.consumer)

    def check(self, attr, type):
      if not isinstance(attr, type):
        raise CheckError(attr + ' is not of type ' + str(type))

    @method
    def login(self, user_name):
        self.user_id = user_name

    @gen.coroutine
    def feed(self, sub_id, query):
        query = query.filter(~r.row.has_fields('deleted'))
        conn = yield self.conn
        feed = yield query.changes(include_initial=True).run(conn)
        self.registered_feeds[sub_id] = feed
        while (yield feed.fetch_next()):
            item = yield feed.next()
            if item.get('old_val') is None:
                self.send_added(sub_id, item['new_val'])
            elif item.get('new_val') is None:
                self.send_removed(sub_id, item['old_val']['id'])
            else:
                self.send_changed(sub_id, item['new_val'])

    def send(self, data):
        def helper(x):
            if(isinstance(x, datetime)):
                # return json.dumps({'$date': x.timestamp()})
                return {'$date': x.timestamp()*1000}
            else:
                return x
        self.write_message(json.dumps(data, default=helper))
        # self.write_message(ejson.dumps(data)) # json dumps with default

    def send_result(self, id, result):
        self.write_message({'msg': 'result', 'id': id, 'result': result})

    def send_error(self, id, error):
        self.write_message({'msg': 'error', 'id': id, 'error': error})

    def send_added(self, sub_id, doc):
        self.send({'msg': 'added', 'id': sub_id, 'doc': doc})
        # self.write_message({'msg': 'added', 'id': sub_id, 'doc': doc})

    def send_changed(self, sub_id, doc):
        self.send({'msg': 'changed', 'id': sub_id, 'doc': doc})
        #self.write_message({'msg': 'changed', 'id': sub_id, 'doc': doc})

    def send_removed(self, sub_id, doc_id):
        self.send({'msg': 'removed', 'id': sub_id, 'doc_id': doc_id})
        #self.write_message({'msg': 'removed', 'id': sub_id, 'doc_id': doc_id})

    def send_ready(self, sub_id):
        self.write_message({'msg': 'ready', 'id': sub_id})

    def send_nosub(self, sub_id, error):
        self.write_message({'msg': 'nosub', 'id': sub_id, 'error': error})

    def send_nomethod(self, method_id, error):
        self.write_message({'msg': 'nomethod', 'id': method_id, 'error': error})

    def send_event(self, msg, data):
        data.msg = msg
        self.write_message(data)

    def on_open(self):
        pass

    def on_message(self, msg):
        print('raw ->', msg)
        @gen.coroutine
        def helper(msg):
            yield self.queue.put(msg)
        tornado.ioloop.IOLoop.current().spawn_callback(helper, msg)

    # consumer can be recoded as:
    # http: // www.tornadoweb.org / en / stable / queues.html?highlight = queue
    @gen.coroutine
    def consumer(self): # all data gets must go inside a try
        while True:
            msg = yield self.queue.get()
            if msg == 'stop':
                return
            # data = ejson.loads(msg) # json.loads con object_hook
            def helper(dct):
                if '$date' in dct.keys():
                    d = datetime.utcfromtimestamp(dct['$date']/1000.0)
                    return d.replace(tzinfo=pytz.UTC)
                return dct
            data = json.loads(msg, object_hook=helper)
            print(data)
            try:
                message = data['msg']
                id = data['id']
                params = data['params']

                if message == 'method':
                    method = data['method']
                    if method not in methods:
                        self.send_nomethod(id, 'method does not exist')
                    else:
                        try:
                          method = getattr(self, method)
                          result = yield method(**params)
                          self.send_result(id, result)
                        except Exception as e:
                          self.send_error(id, str(e))
                elif message == 'sub':
                    name = data['name']
                    if name not in subs:
                        self.send_nosub(id, 'sub does not exist')
                    else:
                        query = getattr(self, name)(**params)
                        tornado.ioloop.IOLoop.current().spawn_callback(self.feed, id, query)
                elif message == 'unsub':
                    feed = self.registered_feeds[id]
                    feed.close()
                    del self.registered_feeds[id]
            except KeyError as e:
              self.send_error(str(e))
            finally:
              self.queue.task_done()

    def on_close(self):
        for feed in self.registered_feeds.values():
            feed.close()
        del sessions[self.session]

        @gen.coroutine
        def helper(): # is it possible to call self.queue.put directly?
            self.queue.put('stop')
        tornado.ioloop.IOLoop.current().spawn_callback(helper)

    @gen.coroutine
    def insert(self, table, doc):
        cans = [c(self, table, doc) for c in can['insert']]
        if not all(cans):
            raise MethodError('can not insert ' + table)
        else:
            self.before_insert(table, doc)
            conn = yield self.conn
            result = yield r.table(table).insert(doc).run(conn)
            # self.after_insert()

    def before_insert(self, collection, doc):
        for hook in hooks['before_insert']:
          hook(self, collection, doc)

    @gen.coroutine
    def update(self, table, id, doc):
        conn = yield self.conn
        old_doc = yield r.table(table).get(id).run(conn)
        cans = [c(self, table, doc, old_doc) for c in can['update']]
        if not all(cans):
            raise MethodError('can not update ' + table + ', id: ' + str(id))
        else:
            self.before_update(table, doc)
            result = yield r.table(table).get(id).update(doc).run(conn)
            #self.after_update()

    def before_update(self, collection, subdoc):
        for hook in hooks['before_update']:
          hook(self, collection, subdoc)

    @gen.coroutine
    def soft_delete(self, table, id):
      conn = yield self.conn
      old_doc = yield r.table(table).get(id).run(conn)
      cans = [c(self, table, old_doc) for c in can['delete']]
      if not all(cans):
        raise MethodError('can not delete ' + table + ', id: ' + str(id))
      else:
        result = yield r.table(table).get(id).update({'deleted': True}).run(conn)
