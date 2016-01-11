module.exports = (function() {

  'use strict';

  const Model = require('./model.js');
  const ModelArray = require('./model_array.js');

  class APIConstructor {

    format(obj, arrInterface, options, useResource) {

      if (obj instanceof Error) {
        return this.error(obj.message, obj.details);
      }

      if (obj instanceof Model) {
        let modelArray = new ModelArray(obj.constructor);
        modelArray.push(obj);
        obj = modelArray;
      }

      if (!(obj instanceof ModelArray)) {
        return this.spoof(obj);
      }

      return this.response(obj, arrInterface, options);

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

    error(message, details) {

      return {
        meta: this.meta(0, 0, 0, {message: message, details: details}),
        data: []
      };

    }

    spoof(obj, options, useResource) {

      if (!(obj instanceof Array)) {
        obj = [obj];
      }

      return {
        meta: this.meta(
          obj.length,
          obj.length,
          0,
          null,
          null,
          useResource && this.resourceFromArray(obj)
        ),
        data: obj
      }

    }

    response(modelArray, arrInterface, options, useResource) {

      return {
        meta: this.meta(
          modelArray.length,
          modelArray.length,
          0,
          null,
          null,
          useResource && this.resourceFromModelArray(modelArray, arrInterface, options)
        ),
        data: modelArray.toObject(arrInterface, options)
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

    resourceFromModelArray(modelArray, arrInterface) {

      return modelArray._modelConstructor.toResource(arrInterface);

    }

  }

  return new APIConstructor();

})();
