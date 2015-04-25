module.exports = (function() {

  var Nodal = require('nodal');
  var Controller = Nodal.Controller;

  function Error404Controller() {
    Controller.apply(this, arguments);
  }

  Error404Controller.prototype = Object.create(Controller.prototype);
  Error404Controller.prototype.constructor = Error404Controller;

  Error404Controller.prototype.get = function(self, params, app, socket) {

    self.status(404);
    self.render(app.template('error/404'), params);

  };

  return Error404Controller;

})();
