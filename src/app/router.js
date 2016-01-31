module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const router = new Nodal.Router();

  const CORSMiddleware = Nodal.require('middleware/cors_middleware.js');
  const GZipRenderware = Nodal.require('renderware/gzip_renderware.js');

  /* Middleware */
  /* executed *before* Controller-specific middleware */

  router.middleware.use(CORSMiddleware);

  /* Renderware */
  /* executed *after* Controller-specific renderware */

  router.renderware.use(GZipRenderware);

  /* Routes */

  router.route('/').use('index_controller.js');
  router.route('/static/*').use('static_controller.js');

  /* generator: begin routes */


  /* generator: end routes */

  router.route('/*').use('error/404_controller.js');

  return router;

})();
