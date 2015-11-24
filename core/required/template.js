"use strict";

module.exports = (function() {

  class Template {

    constructor(app, fn) {
      this._app = app;
      this._fn = fn;
    }

    render(data) {
      return this._fn.call(this, data);
    }

    partial(name, data) {
      return this._app.template(name).render(data);
    }

    rawPartial(name) {
      return this._app.template(name, true).render();
    }

  }

  return Template;

})();
