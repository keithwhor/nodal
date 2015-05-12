module.exports = (function() {

  var Nodal = require('nodal');
  var Initializer = Nodal.Initializer;

  function StaticAssetInitializer() {
    Initializer.apply(this, arguments);
  }

  StaticAssetInitializer.prototype = Object.create(Initializer.prototype);
  StaticAssetInitializer.prototype.constructor = StaticAssetInitializer;

  StaticAssetInitializer.prototype.exec = function(app, callback) {

    app.loadStaticAssets('static');
    callback(null);

  };

  return StaticAssetInitializer;

})();
