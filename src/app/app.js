module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  /* Import Initializers */
  const StaticAssetInitializer = Nodal.require('initializers/static_asset_initializer.js');

  /* Import Middleware */
  const CORSMiddleware = Nodal.require('middleware/cors_middleware.js');

  /* Import Renderware */
  const GzipRenderware = Nodal.require('renderware/gzip_renderware.js');

  /* Import Router */
  const router = Nodal.require('app/router.js');

  /* Import Database */
  // const db = Nodal.require('db/main.js');

  class App extends Nodal.Application {

    __setup__() {

      /* Initializers */
      this.initializers.use(StaticAssetInitializer);

      /* Middleware */
      this.middleware.use(CORSMiddleware);

      /* Renderware */
      this.renderware.use(GzipRenderware);

      /* Router */
      this.useRouter(router);

      /* Database */
      // this.useDatabase(db, 'main');

    }

  }

  return App;

})();
