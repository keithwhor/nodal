module.exports = function(app) {

  var IndexController = require('./controllers/index_controller.js');

  app.route(/^\/?/, IndexController);

};
