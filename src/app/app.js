module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  /* Import Initializers */
  const StaticAssetInitializer = Nodal.require('initializers/static_asset_initializer.js');

  /* Import Middleware */
  const GzipMiddleware = Nodal.require('middleware/gzip_middleware.js');

  /* Import Router */
  const router = Nodal.require('app/router.js');

  /* Import Database */
  // const db = Nodal.require('db/main.js');

  class App extends Nodal.Application {

    __setup__() {

      /* Initializers */
      this.initializers.use(StaticAssetInitializer);

      /* Middleware */
      this.middleware.use(GzipMiddleware);

      /* Router */
      this.useRouter(router);

      /* Database */
      // this.useDatabase(db, 'main');

    }

  }

  return App;

})();
