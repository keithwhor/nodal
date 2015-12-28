module.exports = (function() {

  'use strict';

  /**
  * Array of Models, for easy conversion to Objects
  * @class
  */
  class ModelArray extends Array {

    /**
    * Create the ModelArray with a provided Model to use as a reference.
    * @param {class Nodal.Model} modelConstructor Must pass the constructor for the type of ModelArray you wish to create.
    */
    constructor(modelConstructor) {

      super();
      this._modelConstructor = modelConstructor;

    }

    /**
    * Creates an Array of plain objects from the ModelArray, with properties matching an optional interface
    * @param {optional Array} arrInterface Interface to use for object creation for each model
    */
    toObject(arrInterface) {

      return this.map(m => m.toObject(arrInterface));

    }

  }

  return ModelArray;

})();
