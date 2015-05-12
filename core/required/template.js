module.exports = (function() {

module.exports = class Template {

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

};
