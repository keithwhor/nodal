module.exports = (function() {

  var Model = require('./model.js');
  var ComposerResult = require('./composer_result.js');

  function APIConstructor() {}

  APIConstructor.prototype.format = function(obj) {

    if (obj instanceof Model) {
      return this.formatModel(obj);
    }

    if (obj instanceof ComposerResult) {
      return this.formatComposerResult(obj);
    }

    throw new Error('.format requires Model or ComposerResult');

  };

  APIConstructor.prototype.error = function(message) {

    return {
      meta: this.meta(0, 0, 0, {message: message}),
      data: []
    };

  };

  APIConstructor.prototype.formatComposerResult = function(composerResult) {

    return {
      meta: this.meta(
        composerResult.total,
        composerResult.count,
        composerResult.offset,
        (composerResult.error ? {
          message: 'There was an error with your query',
          details: composerResult.error
        } : null),
        this.resource(composerResult.query._modelConstructor)
      ),
      data: composerResult.rows
    };

  };

  APIConstructor.prototype.formatModel = function(model) {
    return {
      meta: this.meta(1, 1, 0,
        (model.hasErrors() ? {
          message: 'There was an error with your request',
          details: model.errorObject()
        } : null),
        this.resource(model.constructor)
      ),
      data: model.hasErrors() ? [] : [model.toStdObject()],
    };
  };

  APIConstructor.prototype.resource = function(modelConstructor) {

    var columns = modelConstructor.prototype.schema.columns;
    var lookup = [];
    columns.forEach(function(v) { lookup[v.name] = v; });

    var fields = modelConstructor.prototype.externalInterface.map(function(v) {
      return {
        name: v,
        type: lookup[v].type,
        array: !!(lookup[v].properties && lookup[v].properties.array)
      };
    });

    return {
      name: modelConstructor.name,
      fields: fields
    };

  };

  APIConstructor.prototype.meta = function(total, count, offset, error, resource) {

    if (error) {
      total = 0;
      count = 0;
      offset = 0;
      resource = null;
    }

    return {
      total: total,
      count: count,
      offset: offset,
      error: error,
      resource: resource || null
    };

  };

  return new APIConstructor();

})();
