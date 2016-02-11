module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const crypto = require('crypto');
  const fs = require('fs');

  const Error404Controller = Nodal.require('app/controllers/error/404_controller.js');

  class StaticController extends Nodal.Controller {

    get() {

      let filepath = this.params.matches[0];
      let ext = filepath.substr(filepath.lastIndexOf('.') + 1);
      filepath = filepath.replace(/(\.){1,2}\//gi, '');

      fs.readFile(`./static/${filepath}`, (err, buffer) => {

        if (err) {
          return Error404Controller.prototype.get.call(this);
        }

        this.setHeader('Content-Type', Nodal.Mime.lookup(ext) || 'application/octet-stream');

        if (this.getHeader('Content-Type').split(';')[0].split('/')[0] === 'video') {

          let range = this.params.headers.range;
          let len = buffer.byteLength;

          if (range) {

            range = range
              .replace('bytes=', '')
              .split('-')
              .map(v => parseInt(v))
              .filter(v => !isNaN(v))

            if (!range.length) {
              range = [0];
            }

            if (range.length === 1) {
              range.push(len - 1);
            }

            buffer = buffer.slice(range[0], range[1] + 1);

          } else {

            range = [0, len - 1];

          }

          this.status(206);
          this.setHeader('Content-Range', `bytes ${range[0]}-${range[1]}/${len}`);
          this.setHeader('Accept-Ranges', 'bytes');
          this.setHeader('Content-Length', buffer.byteLength);

        } else {

          this.setHeader('Cache-Control', 'max-age=60');
          this.setHeader('ETag', crypto.createHash('md5').update(buffer.toString()).digest('hex'));

        }

        this.render(buffer);

      });

    }

  }

  return StaticController;

})();
