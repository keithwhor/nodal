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
      resource: null,
      meta: this.meta(0, 0, 0, {message: message}),
      data: []
    };

  };

  APIConstructor.prototype.formatComposerResult = function(composerResult) {

    return {
      resource: this.resource(composerResult.query._modelConstructor),
      meta: this.meta(
        composerResult.total,
        composerResult.count,
        composerResult.offset,
        (composerResult.error ? {
          message: 'There was an error with your query',
          details: composerResult.error
        } : null)
      ),
      data: composerResult.rows
    };

  };

  APIConstructor.prototype.formatModel = function(model) {
    return {
      resource: this.resource(model.constructor),
      meta: this.meta(1, 1, 0,
        (model.hasErrors() ? {
          message: 'There was an error with your request',
          details: model.errorObject()
        } : null)),
      data: model.hasErrors() ? [] : [model.toStdObject()],
    };
  };

  APIConstructor.prototype.resource = function(modelConstructor) {

    return {
      name: modelConstructor.name,
      fields: modelConstructor.prototype.externalInterface
    };

  };

  APIConstructor.prototype.meta = function(total, count, offset, error) {

    if (error) {
      total = 0;
      count = 0;
      offset = 0;
    }

    return {
      total: total,
      count: count,
      offset: offset,
      error: error
    };

  };

  return new APIConstructor();

})();
