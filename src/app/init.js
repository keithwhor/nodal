var Nodal = require('nodal');

var app = new Nodal.Application();

/* bind data layer */
app.useDatabase(Nodal.require('db/credentials.js'));

/* Load routes */
Nodal.require('app/routes.js')(app);

/* Initialize App */
app.listen(global.settings.PORT);
