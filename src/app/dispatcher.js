module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const dispatcher = new Nodal.Dispatcher();

  const CORSMiddleware = Nodal.require('middleware/cors_middleware.js');
  const GZipRenderware = Nodal.require('renderware/gzip_renderware.js');

  // Middleware executed *before* Controller-specific middleware
  dispatcher.middleware.use(CORSMiddleware);

  // Renderware executed *after* Controller-specific renderware
  dispatcher.renderware.use(GZipRenderware);

  return dispatcher;

})();
