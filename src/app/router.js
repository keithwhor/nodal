module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const router = new Nodal.Router();

  /* generator: begin imports */


  /* generator: end imports */

  router.route('/').use('index_controller.js');
  router.route('/static/*').use('static_controller.js');

  /* generator: begin routes */


  /* generator: end routes */

  router.route('/*').use('error/404_controller.js');

  return router;

})();
