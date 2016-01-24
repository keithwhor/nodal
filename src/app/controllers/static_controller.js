module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');
  const Error404Controller = Nodal.require('app/controllers/error/404_controller.js');

  class StaticController extends Nodal.Controller {

    get() {

      let staticData = this.app.static(this.params.matches[0]);

      if (!staticData) {
        Error404Controller.prototype.get.apply(this, arguments);
        return;
      }

      this.setHeader('Content-Type', staticData.mime);

      if (staticData.mime.split('/')[0] === 'video') {

        let range = this.params.headers.range;
        let buffer = staticData.buffer;
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
        this.render(buffer);

      } else {

        if (Nodal.env === 'production') {
          this.setHeader('Cache-Control', 'max-age=60');
          this.setHeader('ETag', staticData.tag);
        }

        this.render(staticData.buffer);

      }

    }

  }

  return StaticController;

})();
