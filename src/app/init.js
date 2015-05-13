module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  const StaticAssetInitializer = Nodal.require('initializers/static_asset_initializer.js');
  const GzipMiddleware = Nodal.require('middleware/gzip_middleware.js');

  const app = new Nodal.Application();

  /* use initializer */
  app.initializers.use(StaticAssetInitializer);

  /* use middleware */
  app.middleware.use(GzipMiddleware);

  /* bind data layer */
  app.addDatabase('main', Nodal.my.Config.db.main);

  /* Add authorization */
  app.enableAuth();
  app.auth.setKey(Nodal.my.Config.secrets.auth.key);
  app.auth.definePermission('user', 1);
  app.auth.definePermission('admin', 10);

  /* Initialize App */
  app.initialize(function() {

    app.listen(Nodal.my.Config.secrets.port);

  });

})();
