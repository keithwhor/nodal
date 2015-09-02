module.exports = function(err) {

  "use strict";

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

  const DummyRouter = new Router();
  DummyRouter.route(/.*/, DummyController);

  return DummyRouter;

};
