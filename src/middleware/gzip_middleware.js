module.exports = (function() {

  var Nodal = require('nodal');
  var Middleware = Nodal.Middleware;

  var zlib = require('zlib');

  function GzipMiddleware() {
    Middleware.apply(this, arguments);
  }

  GzipMiddleware.prototype = Object.create(Middleware.prototype);
  GzipMiddleware.prototype.constructor = GzipMiddleware;

  GzipMiddleware.prototype.exec = function(controller, data, callback) {

    var acceptEncoding = controller._request.headers['accept-encoding'] || '';
    var canCompress = !!{
      'text/plain': 1,
      'text/html': 1,
      'text/xml': 1,
      'text/json': 1,
      'text/javascript': 1,
      'application/json': 1,
      'application/xml': 1,
      'application/javascript': 1,
      'application/octet-stream': 1
    }[controller.getHeader('Content-Type')];

    if (canCompress) {

      if (acceptEncoding.match(/\bdeflate\b/)) {

        zlib.deflate(data, function(err, result) {
          if (!err) {
            controller.setHeader('Content-Encoding', 'deflate');
            callback(null, result);
            return;
          }
          callback(null, data);
        });
        return true;

      } else if (acceptEncoding.match(/\bgzip\b/)) {

        zlib.gzip(result, function(err, result) {
          if (!err) {
            controller.setHeader('Content-Encoding', 'gzip');
            callback(null, result);
            return;
          }
          callback(null, data);
        });

        return true;

      }

    }

    callback(null, data);
    return false;

  };

  return GzipMiddleware;

})();
