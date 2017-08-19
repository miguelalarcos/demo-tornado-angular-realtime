# Vue.js --- SDP --- Tornado --- Rethinkdb
# SDP: Subscription Data Protocol
import tornado
import tornado.ioloop
import tornado.websocket
from tornado.queues import Queue
import time
import ejson
import rethinkdb as r
from tornado import gen


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


class SDP(tornado.websocket.WebSocketHandler):

    def __init__(self, application, request):
        super().__init__(application, request)
        self.conn = r.connect(host='localhost', port=28015, db='test')
        self.session = time.time()
        sessions[self.session] = self
        self.registered_feeds = {}
        self.pending_unsubs = []
        self.queue = Queue(maxsize=10)
        tornado.ioloop.IOLoop.current().spawn_callback(self.consumer)

    @gen.coroutine
    def feed(self, sub_id, query):
        conn = yield self.conn
        feed = yield query.changes(include_initial=True).run(conn) # send initials
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
        self.write_message(ejson.dumps(data))

    def send_result(self, id, result):
        self.write_message({'msg': 'result', 'id': id, 'result': result})

    def send_error(self, id, error):
        self.write_message({'msg': 'error', 'id': id, 'error': error})

    def send_added(self, sub_id, doc):
        self.write_message({'msg': 'added', 'id': sub_id, 'doc': doc})

    def send_changed(self, sub_id, doc):
        self.write_message({'msg': 'changed', 'id': sub_id, 'doc': doc})

    def send_removed(self, sub_id, doc_id):
        self.write_message({'msg': 'removed', 'id': sub_id, 'doc_id': doc_id})

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
        print('->', msg)
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
            data = ejson.loads(msg)
            message = data['msg']

            if message == 'method':
                if data['method'] not in methods:
                    self.send_nomethod(data['id'], 'method does not exist')
                else:
                    method = getattr(self, data['method'])
                    result = yield method(**data['params'])
                    self.send_result(data['id'], result)
            elif message == 'sub':
                if data['name'] not in subs:
                    self.send_nosub(data['id'], 'sub does not exist')
                else:
                    query = getattr(self, data['name'])(**data['params'])
                    tornado.ioloop.IOLoop.current().spawn_callback(self.feed, data['id'], query)
                #prefixed = 'sub_' + data['name']
                #try:
                #    query = getattr(self, prefixed)(**data['params'])
                #    tornado.ioloop.IOLoop.current().spawn_callback(self.feed, data['id'], query)
                #except AttributeError:
                #    self.send_nosub(data['id'], 'sub does not exist')
            elif message == 'unsub':
                id = data['id']
                feed = self.registered_feeds[id]
                feed.close()
                del self.registered_feeds[id]

            self.queue.task_done()



    def on_close(self):
        for feed in self.registered_feeds.values():
            feed.close()
        del sessions[self.session]

        @gen.coroutine
        def helper():
            self.queue.put('stop')
        tornado.ioloop.IOLoop.current().spawn_callback(helper)

    @gen.coroutine
    def insert(self, collection, doc):
        self.before_insert(collection, doc)
        conn = yield self.conn
        result = yield r.table(collection).insert(doc).run(conn)
        self.after_insert(result)

    def before_insert(self, collection, doc):
        pass

    def after_insert(self, result):
        pass

    @gen.coroutine
    def update(self, collection, id, subdoc):
        self.before_update(collection, subdoc)
        conn = yield self.conn
        result = yield r.table(collection).get(id).update(subdoc).run(conn)
        self.after_update()

    def before_update(self, collection, subdoc):
        pass

    def after_update(self):
        pass