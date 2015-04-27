module.exports = (function() {

  function Template(app, fn) {
    this._app = app;
    this._fn = fn;
  }

  Template.prototype.render = function(data) {
    return this._fn.call(this, data);
  };

  Template.prototype.partial = function(name, data) {
    return this._app.template(name).render(data);
  };

  return Template;

})();
