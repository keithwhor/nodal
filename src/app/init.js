var Application = require('nodal').Application;

var app = new Application();

/* bind data layer */
app.useDatabase(require('../db/credentials.js'));

/* Load routes */
require('./routes.js')(app);

/* Initialize App */
app.listen(global.settings.PORT);
