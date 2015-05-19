module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');
  const app = new Nodal.Application();

  /* use initializer */
  const StaticAssetInitializer = Nodal.require('initializers/static_asset_initializer.js');
  app.initializers.use(StaticAssetInitializer);

  /* use middleware */
  const GzipMiddleware = Nodal.require('middleware/gzip_middleware.js');
  app.middleware.use(GzipMiddleware);

  /* use router */
  const router = Nodal.require('app/router.js');
  app.useRouter(router);

  /* use database, assign an alias */
  // const db = Nodal.require('db/main.js');
  // app.useDatabase(db, 'main');

  /* Initialize App */
  app.initialize(function() {

    app.listen(Nodal.my.Config.secrets.port);

  });

})();
