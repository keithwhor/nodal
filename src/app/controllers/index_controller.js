module.exports = (function() {

  var Nodal = require('nodal');
  var Controller = Nodal.Controller;

  function IndexController() {
    Controller.apply(this, arguments);
  }

  IndexController.prototype = Object.create(Controller.prototype);
  IndexController.prototype.constructor = IndexController;

  IndexController.prototype.get = function(self, params, app) {

    self.render(app.template('index'), params);

  };

  return IndexController;

})();
