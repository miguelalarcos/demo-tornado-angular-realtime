import tornado.ioloop
import tornado.web
from sdp import SDP, method, sub, before_insert
import rethinkdb as r
import time


class App(SDP):

    @method
    def add(self, a, b):
        return a + b

    @before_insert('cars')
    def created_at(doc):
      doc['created_at'] = time.time()

    @method
    def change_color(self, id, color):
        yield self.update('cars', id, {'color': color})

    @method
    def create_car_of_color(self, color, matricula):
        self.check(color, str)
        self.check(matricula, str)
        yield self.insert('cars', {'matricula': matricula, 'color': color})

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
