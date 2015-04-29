var Nodal = require('nodal');

var app = new Nodal.Application();

/* bind data layer */
app.addDatabase('main', Nodal.Config.db.main);

/* Add authorization */
app.enableAuth();
app.auth.setKey(Nodal.Config.secrets.auth.key);
app.auth.setTTL(Nodal.Config.secrets.auth.ttl);

/* Initialize App */
app.listen(Nodal.Config.port);
