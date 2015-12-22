module.exports = (function() {

  'use strict';

  class ModelArray extends Array {

    constructor(Model) {

      super();
      this.Model = Model;

    }

    toObject(arrInterface) {

      return this.map(m => m.toObject(arrInterface));

    }

  }

  return ModelArray;

})();
