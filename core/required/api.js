"use strict";

module.exports = (function() {

  const Model = require('./model.js');
  const ComposerResult = require('./composer_result.js');

  class APIConstructor {

    format(obj) {

      if (obj instanceof Model) {
        return this.formatModel(obj);
      }

      if (obj instanceof ComposerResult) {
        return this.formatComposerResult(obj);
      }

      if (obj instanceof Array) {
        return this.formatArray(obj);
      }

      throw new Error('.format requires Model, ComposerResult, or Array of data');

    }

    error(message) {

      return {
        meta: this.meta(0, 0, 0, {message: message}),
        data: []
      };

    }

    formatComposerResult(composerResult) {

      return {
        meta: this.meta(
          composerResult.total,
          composerResult.count,
          composerResult.offset,
          (composerResult.error ? {
            message: 'There was an error with your query',
            details: composerResult.error
          } : null),
          this.resourceFromModel(composerResult.query._modelConstructor)
        ),
        data: composerResult.rows
      };

    }

    formatModel(model) {

      return {
        meta: this.meta(1, 1, 0,
          (model.hasErrors() ? {
            message: 'There was an error with your request',
            details: model.errorObject()
          } : null),
          this.resourceFromModel(model.constructor)
        ),
        data: model.hasErrors() ? [] : [model.toExternalObject()],
      };
      
    }

    formatArray(arr) {

      return {
        meta: this.meta(arr.length, arr.length, 0, null, this.resourceFromArray(arr)),
        data: arr
      }

    }

    resourceFromArray(arr) {

      function getType(v) {
        v = (v instanceof Array) ? v[0] : v;
        return {
          'boolean': 'boolean',
          'string': 'string',
          'number': 'float'
        }[(typeof v)] || ((v instanceof Date) ? 'datetime' : 'string');
      };

      let fields = [];

      if (arr.length && arr[0] && typeof arr[0] === 'object') {
        let datum = arr[0];
        fields = Object.keys(datum).map(function(v, i) {

          return {
            name: v,
            type: getType(datum[v]),
            array: (v instanceof Array)
          }

        });
      }

      return {
        name: 'object',
        fields: fields
      }

    }

    resourceFromModel(modelConstructor) {

      let columns = modelConstructor.prototype.schema.columns;
      let lookup = [];
      columns.forEach(function(v) { lookup[v.name] = v; });

      let fields = modelConstructor.prototype.externalInterface.map(function(v) {
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

    }

    meta(total, count, offset, error, resource) {

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

    }

  };

  return new APIConstructor();

})();
