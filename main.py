import tornado.ioloop
import tornado.web
from sdp import SDP, method, sub, before_insert, can_update, can_insert
import rethinkdb as r
import time
from datetime import datetime, timezone
import pytz

class App(SDP):

    @method
    def add(self, a, b):
        return a + b

    @method
    def log_object(self, **doc):
        print(doc)
        yield self.update('cars', doc['id'], {'created_at2': doc['created_at']})

    @can_insert('cars')
    def is_logged(self, doc):
        return self.user_id is not None

    @can_update('cars')
    def is_owner(self, doc, old_doc):
        return old_doc['owner'] == self.user_id

    @before_insert('cars')
    def created_at(self, doc):
        doc['created_at'] = datetime.now(timezone.utc)
        doc['owner'] = self.user_id

    @method
    def change_color(self, id, color):
        yield self.update('cars', id, {'color': color})

    @method
    def create_car_of_color(self, color, matricula):
        self.check(color, str)
        self.check(matricula, str)
        yield self.insert('cars', {'matricula': matricula, 'color': color})

    @method
    def delete_car(self, id):
        yield self.soft_delete('cars', id)

    @sub
    def cars_of_color(self, color):
        return r.table('cars').filter({'color': color})


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("dist/index.html")


class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header("Cache-control", "no-cache")


def make_app():
    return tornado.web.Application([
        (r'/', MainHandler),
        (r"/ws", App),
        (r'/(.*)', NoCacheStaticFileHandler, {'path': './dist'}),
    ])


if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()
