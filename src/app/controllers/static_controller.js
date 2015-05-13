"use strict";

module.exports = (function() {

  const Nodal = require('nodal');
  const Error404Controller = Nodal.require('app/controllers/error/404_controller.js');

  class StaticController extends Nodal.Controller {

    constructor () {
      super()
    }

    get(self, params, app) {

      let staticData = app.static(this.path().substr('/static/'.length));

      if (!staticData) {
        Error404Controller.prototype.get.apply(this, arguments);
        return;
      }

      self.setHeader('Content-Type', staticData.mime);
      self.render(staticData.buffer);

    }

  }

  return StaticController;

})();
