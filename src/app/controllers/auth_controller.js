module.exports = (function() {

  var Nodal = require('nodal');
  var Controller = Nodal.Controller;

  function AuthController() {
    Controller.apply(this, arguments);
  }

  AuthController.prototype = Object.create(Controller.prototype);
  AuthController.prototype.constructor = AuthController;

  AuthController.prototype.post = function(self, params, app) {

    // basic auth?

  };

  return IndexController;

})();
