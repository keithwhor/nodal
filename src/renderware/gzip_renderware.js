'use strict';

const Nodal = require('nodal');
const zlib = require('zlib');

class GzipRenderware {

  exec(controller, data, callback) {

    let contentType = controller.getHeader('Content-Type', '').split(';')[0];

    let acceptEncoding = controller._requestHeaders['accept-encoding'] || '';
    let canCompress = !!{
      'text/plain': 1,
      'text/html': 1,
      'text/xml': 1,
      'text/json': 1,
      'text/javascript': 1,
      'application/json': 1,
      'application/xml': 1,
      'application/javascript': 1,
      'application/octet-stream': 1
    }[contentType];

    if (canCompress) {

      if (acceptEncoding.match(/\bgzip\b/)) {

        zlib.gzip(data, function(err, result) {
          if (!err) {
            controller.setHeader('Content-Encoding', 'gzip');
            callback(null, result);
            return;
          }
          callback(null, data);
        });

        return true;

      } else if(acceptEncoding.match(/\bdeflate\b/)) {

        zlib.deflate(data, function(err, result) {
          if (!err) {
            controller.setHeader('Content-Encoding', 'deflate');
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

  }

}

module.exports = GzipRenderware;
