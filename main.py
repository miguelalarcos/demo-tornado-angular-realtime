import tornado.ioloop
import tornado.web
from sdp import SDP, method, sub
import rethinkdb as r


class App(SDP):

    @method
    def add(self, a, b):
        return a + b

    @method
    def change_color(self, id, color):
        yield self.update('cars', id, {'color': color})

    @method
    def create_red_car(self, matricula):
        yield self.insert('cars', {'matricula': matricula, 'color': 'red'})

    @sub
    def cars_of_color(self, color):
        return r.table('cars').filter({'color': color})


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")


class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header("Cache-control", "no-cache")


def make_app():
    return tornado.web.Application([
        (r'/', MainHandler),
        (r'/dest/(.*)', NoCacheStaticFileHandler, {'path': './dest'}),
        (r"/ws", App),
    ])


if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()