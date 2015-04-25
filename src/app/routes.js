module.exports = function(app) {

  var Nodal = require('nodal');

  var IndexController = Nodal.require('app/controllers/index_controller.js');
  var StaticController = Nodal.require('app/controllers/static_controller.js');
  var Error404Controller = Nodal.require('app/controllers/error/error_404_controller.js');

  app.route(/^\/?/, IndexController);
  app.route(/^\/static\/.*/, StaticController);

  /* Begin app routes */

  /* End app routes */

  app.route(/.*/, Error404Controller);

};
