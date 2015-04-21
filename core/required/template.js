module.exports = (function() {

  function Template(app, fn) {
    this._app = app;
    this._fn = fn;
  }

  Template.prototype.render = function(data) {
    return this._fn(new TemplateData(this._app, data));
  };

  /* */

  function TemplateData(app, data) {
    this._app = app;
    this._data = data;
  }

  TemplateData.prototype.get = function(key, value) {
    if(this._data.hasOwnProperty(key)) {
      return this._data[key];
    }
    return value;
  };

  TemplateData.prototype.partial = function(name) {
    return this._app.template(name).render(this._data);
  };

  return Template;

})();
