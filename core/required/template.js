module.exports = (function() {

  'use strict';

  const dot = require('dot');
  const fs = require('fs');

  dot.templateSettings.varname = 'params, data';
  dot.templateSettings.strip = false;

  /**
  * The current template, bound to specific params and data (passed on to partials)
  * @class
  */
  class ActiveTemplate {

    /**
    * @param {Nodal.Template} template The parent template
    * @param {Object} params The parameters for the template
    * @param {Object} data The data for the template
    */
    constructor(template, params, data) {

      this.template = template;
      this._params = params;
      this._data = data;

    }

    /**
    * Render the template based on this ActiveTemplate's params and data
    * @return {string}
    */
    render() {

      return this.template._fn.call(this, this._params, this._data);


    }

    /**
    * Renders another template template based upon this ActiveTemplate's params and data
    * @return {string}
    */
    partial(name) {

      return this.template.constructor.generate(name).render(this._params, this._data);

    }

    /**
    * Renders another raw template template based upon this ActiveTemplate's params and data
    * @return {string} name The raw partial to render
    */
    rawPartial(name) {

      return this.template.constructor.raw(name).render(this._params, this._data);

    }

    /**
    * Renders another template template based upon this ActiveTemplate's params and data
    * @return {string}
    */
    child() {

       return this.template.constructor.generate.apply(
         this.template.constructor,
         this.template._children
       ).render(this._params, this._data);

    }

  }

  /**
  * Light wrapper around template functions, creates ActiveTemplates from provided params and data
  * @class
  */
  class Template {

    /**
    * Set default key-value pair for data objects to be sent to templates. i.e. "api_url" if you need it accessible from every template.
    * @param {string} name Key which you're setting for the data object
    * @param {any} value Value which you're setting for the specified key
    * @return {any}
    */
    static setData(name, value) {
      this._data[name] = value;
      return value;
    }

    /**
    * Unsets template data for the specified key
    * @param {string} name Key which you're unsetting
    */
    static unsetData(name) {
      delete this._data[name];
    }

    /**
    * Retrieves the template from the cache or loads the template and caches it
    * @param {string} The template name (full path in the the app/templates directory).
    * @param {optional boolean} raw Whether or not the template is "raw" (i.e. just an HTML string, no template engine required.) Defaults to false.
    * @return {Nodal.Template} The template instance
    */
    static get(name, raw) {

      raw = !!raw | 0; // coerce to 0, 1

      if (!this._templates[name]) {
        this._templates[name] = Array(2);
      }

      if(this._templates[name][raw]) {
        return this._templates[name][raw];
      }

      let filename = './app/templates/' + name;

      try {

        let contents = fs.readFileSync(filename);
        this._templates[name][raw] = raw ? () => { return contents; } : dot.template(contents);
        return this._templates[name][raw];

      } catch(e) {

        console.log(e);
        console.log('Could not load template ' + name);

      }

      return this._templates['!'];

    }

    /**
    * Retrieves the template matching the provided name. Lazy loads new templates from disk, otherwise caches.
    * @param {string} templates List of heirarchy of templates (each a full path in the the app/templates directory).
    * @return {Nodal.Template} The template instance
    */
    static generate(name) {

      let templates = Array.prototype.slice.call(arguments)

      if (templates.length === 1) {
        return new Template(this.get(name));
      }

      return new Template(
        this.get(name),
        templates.slice(1)
      );

    }

    /**
    * Retrieves a "raw" template (i.e. just an HTML string, no template engine required.)
    * @param {string} name The traw emplate name (full path in the the app/templates directory).
    * @return {Nodal.Template} The template instance
    */
    static raw(name) {

      return new Template(this.get(name, true));

    }

    /**
    * @param {function} fn The method to render your template with
    * @param {string} children Remaining children template in heirarchy
    */
    constructor(fn, children) {

      this._fn = fn;
      this._children = children;

    }

    /**
    * Generates (renders) your template by creating an ActiveTemplate instance
    * @param {Object} params The parameters for the template
    * @param {Object} data The data for the template
    * @return {ActiveTemplate}
    */
    render(params, data) {
      params = params || {};
      data = data || {};

      let _data = this.constructor._data;

      Object.keys(_data)
        .filter(k => !data.hasOwnProperty(k))
        .forEach(k => data[k] = _data[k]);

      return new ActiveTemplate(this, params, data).render();

    }

  }

  Template._data = {};
  Template._templates = {
    '!': new Template(function() { return '<!-- Invalid Template //-->'; })
  };

  return Template;

})();
