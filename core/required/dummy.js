module.exports = function(err) {

  "use strict";

  const Application = require('./application.js');
  const Controller = require('./controller.js');
  const Router = require('./router.js');

  class DummyController extends Controller {

    get(self, params, app) {

      self.status(500);
      self.setHeader('Content-Type', 'text/plain');

      let message = 'Application Error';

      if ((process.env.NODE_ENV || 'development') === 'development' && err) {
        message += '\n\n' + err.stack;
      }

      self.render(message);

    }

  }

  class DummyApp extends Application {

    __setup__() {

      let router = new Router();
      router.route(/.*/, DummyController);

      this.useRouter(router);

    }

    __initialize__() {

      let config = require('./my/config.js')(process.cwd());
      this.listen(config.secrets.port);

    }

  }

  return new DummyApp();

};
