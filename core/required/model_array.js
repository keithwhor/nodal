module.exports = (function() {

  'use strict';

  /**
  * Array of Models, for easy conversion to Objects
  * @class
  */
  class ModelArray extends Array {

    /**
    * Create the ModelArray with a provided Model to use as a reference.
    * @param {Array|class Nodal.Model} modelConstructor Must pass the constructor for the type of ModelArray you wish to create.
    */
    constructor(modelConstructor) {

      super();
      this._modelConstructor = modelConstructor;

    }

    /**
    * Convert a normal Array into a ModelArray
    * @param {Array} arr The array of child objects
    */
    static from(arr) {

      if (!arr.length) {
        throw new Error('Cannot create ModelArray from empty Aray');
      }

      let modelArray = new this(arr[0].constructor);
      modelArray.push.apply(modelArray, arr);

      return modelArray;

    }

    /**
    * Creates an Array of plain objects from the ModelArray, with properties matching an optional interface
    * @param {Array} arrInterface Interface to use for object creation for each model
    * @param {Object} opts Options for the object conversion
    */
    toObject(arrInterface, opts, maxDepth, depth) {

      maxDepth = maxDepth || 1;
      depth = depth || 0;

      if (depth > maxDepth) {
        return;
      }

      return this.map(m => m.toObject(arrInterface));

    }

    /**
    * Calls Model#read on each Model in the ModelArray
    * @param {Object}
    */
    readAll(data) {
      this.forEach(model => model.read(data));
      return true;
    }

    /**
    * Calls Model#read on each Model in the ModelArray
    * @param {Object}
    */
    setAll(field, value) {
      this.forEach(model => model.set(field, value));
      return true;
    }

    /**
    * Saves / updates all models in the ModelArray. Will return an error and rollback if *any* model errors out.
    * @param {function({Error}, {ModelArray})} callback returning the error or saved ModelArray
    */
    saveAll(callback) {

      if (!this.length) {
        return callback.call(this, null, this);
      }

      let firstErrorModel = this.filter(m => m.hasErrors()).shift();
      if (firstErrorModel) {
        return callback.call(this, firstErrorModel.errorObject(), this);
      }

      let db = this._modelConstructor.prototype.db;

      db.transaction(
        this.map(m => {
          let query = m.__generateSaveQuery__();
          return [query.sql, query.params];
        }),
        (err, result) => {

          if (err) {
            return callback.call(this, new Error(err.message), this);
          }

          this.forEach((m, i) => {
            m.__load__(result[i].rows[0], true);
            Object.keys(m._joinsCache).forEach(field => m.setJoinedId(field));
          });
          callback.call(this, null, this);

        }
      )

    }

  }

  return ModelArray;

})();
