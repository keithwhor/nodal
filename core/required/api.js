module.exports = (function() {

  var Model = require('./model.js');

  function APIConstructor() {}

  APIConstructor.prototype.format = function(model) {

    if (!(model instanceof Model)) {
      throw new Error('Format requires a valid model response');
    }

    return {
      meta: this.meta(1, 1, 0, model.errorObject(), this.resource(model)),
      data: model.hasErrors() ? [] : [model.toObject()],
    };

  };

  APIConstructor.prototype.resource = function(model) {

    return {
      name: model.constructor.name,
      children: []
    };

  };

  APIConstructor.prototype.meta = function(total, count, offset, error, resource) {

    if (error) {
      total = 0;
      count = 0;
      offset = 0;
    }

    resource = resource || {};

    return {
      total: total,
      count: count,
      offset: offset,
      error: error,
      resource: resource
    };

  };

  return new APIConstructor();

})();
