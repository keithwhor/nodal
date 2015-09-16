module.exports = (function() {

  'use strict';

  const Model = require('./model.js');
  const ComposerResult = require('./composer/composer_result.js');
  const ComposerRecord = require('./composer/record.js');

  class APIConstructor {

    format(obj, summary) {

      if (obj instanceof Model) {
        return this.formatModel(obj);
      } else if (obj instanceof ComposerResult) {
        return this.formatComposerResult(obj);
      } else if (obj instanceof ComposerRecord) {
        return this.formatComposerRecord(obj);
      } else if (obj instanceof Array) {
        return this.formatArray(obj, summary);
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
          this.formatSummary(),
          this.resourceFromModel(composerResult.query._modelConstructor)
        ),
        data: composerResult.rows
      };

    }

    formatComposerRecord(composerRecord) {

      return {
        meta: this.meta(
          composerRecord.total,
          composerRecord.count,
          composerRecord.offset,
          (composerRecord.error ? {
            message: 'There was an error with your query',
            details: composerRecord.error
          } : null),
          composerRecord.summary,
          composerRecord.resource
        ),
        data: composerRecord.data
      };

    }

    formatSummary() {

      // TODO: deprecate

      return {};

    }

    formatModel(model) {

      let rows = model.hasErrors() ? [] : [model.toExternalObject()];

      return {
        meta: this.meta(1, 1, 0,
          (model.hasErrors() ? {
            message: 'There was an error with your request',
            details: model.errorObject()
          } : null),
          this.formatSummary(),
          this.resourceFromModel(model.constructor)
        ),
        data: rows
      };

    }

    formatArray(arr) {

      return {
        meta: this.meta(arr.length, arr.length, 0, null, this.formatSummary(), this.resourceFromArray(arr)),
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

    meta(total, count, offset, error, summary, resource) {

      if (error) {
        total = 0;
        count = 0;
        offset = 0;
        resource = null;
      }

      let meta = {
        total: total,
        count: count,
        offset: offset,
        error: error
      };

      summary && (meta.summary = summary);
      resource && (meta.resource = resource);

      return meta;

    }

  };

  return new APIConstructor();

})();
