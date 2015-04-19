var Application = require('nodal').Application;
var Database = require('nodal').Database(require('../db/credentials.js'));

var app = new Application();
var db = new Database();

/* Initialize App */
app.listen(global.settings.PORT);

/* Load routes */
require('./routes.js')(app, db);
