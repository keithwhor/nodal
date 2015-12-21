module.exports = (function() {

  'use strict';

  class StaticAssetInitializer {

    exec(app, callback) {
      app.loadStaticAssets('static');
      callback(null);
    }

  }

  return StaticAssetInitializer;

})();
