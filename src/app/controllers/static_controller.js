module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');
  const Error404Controller = Nodal.require('app/controllers/error/404_controller.js');

  class StaticController extends Nodal.Controller {

    get(self, params, app) {

      let staticData = app.static(params.path[1]);

      if (!staticData) {
        Error404Controller.prototype.get.apply(this, arguments);
        return;
      }

      self.setHeader('Content-Type', staticData.mime);

      if (staticData.mime.split('/')[0] === 'video') {

        let range = params.headers.range;
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

        self.status(206);
        self.setHeader('Content-Range', `bytes ${range[0]}-${range[1]}/${len}`);
        self.setHeader('Accept-Ranges', 'bytes');
        self.setHeader('Content-Length', buffer.byteLength);
        self.render(buffer);

      } else {

        if (Nodal.my.Config.env === 'production') {
          self.setHeader('Cache-Control', 'max-age=60');
          self.setHeader('ETag', staticData.tag);
        }

        self.render(staticData.buffer);

      }

    }

  }

  return StaticController;

})();
