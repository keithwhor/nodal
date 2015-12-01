module.exports = (function() {

  'use strict';

  class TemplateInstance {

    constructor(template, params, data) {

      this.template = template;
      this._params = params;
      this._data = data;

    }

    generate() {

      return this.template._fn.call(this, this._params, this._data);

    }

    partial(name, raw) {

      return this.template._app.template(name, !!raw).generate(this._params, this._data);

    }

  }

  class Template {

    constructor(app, fn) {

      this._app = app;
      this._fn = fn;

    }

    generate(params, data) {
      return new TemplateInstance(this, params, data).generate();
    }

  }

  return Template;

})();
