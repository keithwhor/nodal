module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  const router = new Nodal.Router();

  const IndexController = Nodal.require('app/controllers/index_controller.js');
  const StaticController = Nodal.require('app/controllers/static_controller.js');
  const Error404Controller = Nodal.require('app/controllers/error/404_controller.js');

  router.route(/^\/?/, IndexController);
  router.route(/^\/static\/.*/, StaticController);

  /* Begin routes */

  /* End routes */

  router.route(/.*/, Error404Controller);

  return router;

})();
