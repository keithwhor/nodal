module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const router = new Nodal.Router();

  /* Middleware */
  /* executed *before* Controller-specific middleware */

  router.middleware.use('middleware/cors_middleware.js');
  // router.middleware.use('middleware/force_www_middleware.js');
  // router.middleware.use('middleware/force_https_middleware.js');

  /* Renderware */
  /* executed *after* Controller-specific renderware */

  router.renderware.use('renderware/gzip_renderware.js');

  /* Routes */

  router.route('/').use('app/controllers/index_controller.js');
  router.route('/static/*').use('app/controllers/static_controller.js');

  /* generator: begin routes */


  /* generator: end routes */

  router.route('/*').use('app/controllers/error/404_controller.js');

  return router;

})();
