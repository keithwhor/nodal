module.exports = (function() {

  var Nodal = require('nodal');
  var Initializer = Nodal.Initializer;

  function DefaultInitializer() {
    Initializer.apply(this, arguments);
  }

  DefaultInitializer.prototype = Object.create(Initializer.prototype);
  DefaultInitializer.prototype.constructor = DefaultInitializer;

  DefaultInitializer.prototype.exec = function(callback) {

    var e = null;
    callback(e);

  };

  return DefaultInitializer;

})();
