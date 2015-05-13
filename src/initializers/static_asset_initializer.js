module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class StaticAssetInitializer extends Nodal.Initializer {

    exec(app, callback) {
      app.loadStaticAssets('static');
      callback(null);
    }

  }

  return StaticAssetInitializer;

})();
