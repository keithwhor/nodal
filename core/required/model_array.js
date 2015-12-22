module.exports = (function() {

  'use strict';

  class ModelArray extends Array {

    constructor(modelConstructor) {

      super();
      this._modelConstructor = modelConstructor;

    }

    toObject(arrInterface) {

      return this.map(m => m.toObject(arrInterface));

    }

  }

  return ModelArray;

})();
