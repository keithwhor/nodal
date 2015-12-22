module.exports = (function() {

  'use strict';

  class ModelArray extends Array {

    constructor(Model) {

      this.Model = Model;
      
    }

    toObject() {

      return this.map(m => m.toObject());

    }

  }

  return ModelArray;

})();
