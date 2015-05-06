module.exports = (function() {

  var Nodal = require('nodal');

  var router = new Nodal.Router();

  var IndexController = Nodal.require('app/controllers/index_controller.js');
  var StaticController = Nodal.require('app/controllers/static_controller.js');
  var Error404Controller = Nodal.require('app/controllers/error/404_controller.js');

  router.route(/^\/?/, IndexController);
  router.route(/^\/static\/.*/, StaticController);

  /* Begin routes */

  /* End routes */

  router.route(/.*/, Error404Controller);

  return router;

})();
