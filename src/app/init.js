var Nodal = require('nodal');

var GzipMiddleware = Nodal.require('middleware/gzip_middleware.js');
var DefaultInitializer = Nodal.require('initializers/default_initializer.js');

var app = new Nodal.Application();

/* use initializer */
app.initializers.use(DefaultInitializer);

/* use middleware */
app.middleware.use(GzipMiddleware);

/* bind data layer */
app.addDatabase('main', Nodal.Config.db.main);

/* Add authorization */
app.enableAuth();
app.auth.setKey(Nodal.Config.secrets.auth.key);
app.auth.setTTL(Nodal.Config.secrets.auth.ttl);

/* Initialize App */
app.initialize(function() {

  app.listen(Nodal.Config.secrets.port);

});
