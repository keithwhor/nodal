module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const router = new Nodal.Router();

  const CORSMiddleware = Nodal.require('middleware/cors_middleware.js');

  /* Force WWW for naked domain or HTTPS */
  // const ForceWWWMiddleware = Nodal.require('middleware/force_www_middleware.js');
  // const ForceHTTPSMiddleware = Nodal.require('middleware/force_https_middleware.js');

  const GZipRenderware = Nodal.require('renderware/gzip_renderware.js');

  /* Middleware */
  /* executed *before* Controller-specific middleware */

  router.middleware.use(CORSMiddleware);
  // router.middleware.use(ForceWWWMiddleware);
  // router.middleware.use(ForceHTTPSMiddleware);

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
