module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class StaticAssetInitializer extends Nodal.Initializer {

    constructor() {
      super();
    }

    exec(app, callback) {
      app.loadStaticAssets('static');
      callback(null);
    }

  }

  return StaticAssetInitializer;

})();
