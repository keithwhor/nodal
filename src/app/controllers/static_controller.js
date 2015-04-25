module.exports = (function() {

  var Nodal = require('nodal');
  var Controller = Nodal.Controller;
  var Error404Controller = Nodal.require('app/controllers/error/error_404_controller.js');

  function StaticController() {
    Controller.apply(this, arguments);
  }

  StaticController.prototype = Object.create(Controller.prototype);
  StaticController.prototype.constructor = StaticController;

  StaticController.prototype.get = function(self, params, app, socket) {

    var staticData = app.static(this.path());

    if (!staticData) {
      Error404Controller.prototype.get.apply(this, arguments);
      return;
    }

    self.setHeader('Content-Type', staticData.mime);
    self.render(staticData.buffer);

  };

  return StaticController;

})();
