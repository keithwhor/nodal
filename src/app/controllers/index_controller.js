module.exports = (function() {

  var Controller = require('nodal').Controller;

  function IndexController() {
    Controller.apply(this, arguments);
  }

  IndexController.prototype = Object.create(Controller.prototype);
  IndexController.prototype.constructor = IndexController;

  IndexController.prototype.get = function(self, params, app, socket) {

    self.render(app.template('index'), params);

  };

  return IndexController;

})();
