module.exports = function(err) {

  'use strict';

  const Controller = require('./controller.js');
  const Router = require('./router.js');

  class DummyController extends Controller {

    get() {

      this.status(500);
      this.setHeader('Content-Type', 'text/plain');

      let message = 'Application Error';

      if ((process.env.NODE_ENV || 'development') === 'development' && err) {
        message += '\n\n' + err.stack;
      }

      this.render(message);

    }

    post() {
      this.get();
    }

    put() {
      this.get();
    }

    del() {
      this.get();
    }

    options() {
      this.get();
    }

  }

  const DummyRouter = new Router();
  DummyRouter.route(/.*/, DummyController);

  return DummyRouter;

};
