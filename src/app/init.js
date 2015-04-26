var Nodal = require('nodal');

var app = new Nodal.Application();

/* bind data layer */
app.addDatabase('main', Nodal.Config.db.main);

/* Initialize App */
app.listen(global.settings.PORT);
