module.exports = function(app, db) {

  var IndexController = require('./controllers/index_controller.js')(db);

  app.route(/^\/?/, IndexController);

};
