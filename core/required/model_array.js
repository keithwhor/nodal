'use strict';

const async = require('async');

const ItemArray = require('./item_array.js');

/**
* Array of Models, for easy conversion to Objects
* @class
*/
class ModelArray extends ItemArray {

  /**
  * Create the ModelArray with a provided Model to use as a reference.
  * @param {Array|class Nodal.Model} modelConstructor Must pass the constructor for the type of ModelArray you wish to create.
  */
  constructor(modelConstructor) {

    super();
    this.Model = modelConstructor;

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
  */
  toObject(arrInterface) {

    return this.map(m => m.toObject(arrInterface));

  }

  /**
  * Checks if ModelArray has a model in it
  * @param {Nodal.Model} model
  */
  has(model) {
    return this.filter(m => m.get('id') === model.get('id')).length > 0;
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
  * Destroys (deletes) all models in the ModelArray from the database
  * @param {function} callback Method to invoke upon completion
  */
  destroyAll(callback) {

    if (this.filter(m => !m.inStorage()).length) {
      return callback(new Error('Not all models are in storage'))
    }

    let db = this.Model.prototype.db;

    let params = this.map(m => m.get('id'));
    let sql = db.adapter.generateDeleteAllQuery(this.Model.table(), 'id', params);

    db.query(
      sql,
      params,
      (err, result) => {

        if (err) {
          return callback.call(this, new Error(err.message));
        }

        this.forEach(m => m._inStorage = false);

        callback.call(this, null);

      }
    );

  }

  /**
  * Destroys model and cascades all deletes.
  * @param {function} callback method to run upon completion
  */
  destroyCascade(callback) {

    let db = this.Model.prototype.db;

    if (this.filter(m => !m.inStorage()).length) {
      return callback(new Error('Not all models are in storage'))
    }

    let params = this.map(m => m.get('id'));
    let txn = [[db.adapter.generateDeleteAllQuery(this.Model.table(), 'id', params), params]];

    let children = this.Model.relationships().cascade();
    txn = txn.concat(
      children.map(p => {
        return [db.adapter.generateDeleteAllQuery(p.getModel().table(), 'id', params, p.joins(null, this.Model.table())), params];
      })
    ).reverse();

    db.transaction(
      txn,
      (err, result) => {

        if (err) {
          return callback(err);
        }

        this.forEach(m => m._inStorage = false);

        callback(null);

      }
    );

  }

  /**
  * Saves / updates all models in the ModelArray. Uses beforeSave / afterSave. Will return an error and rollback if *any* model errors out.
  * @param {function} callback returning the error and reference to self
  */
  saveAll(callback) {

    if (!this.length) {
      return callback.call(this, null, this);
    }

    async.series(
      this.map(m => m.beforeSave.bind(m)),
      err => {

        if (err) {
          return callback(err);
        }

        this.__saveAll__(err => {

          if (err) {
            return callback(err, this);
          }

          async.series(
            this.map(m => m.afterSave.bind(m)),
            err => callback(err || null, this)
          );

        });

      }
    );

  }

  /**
  * save all models (outside of beforeSave / afterSave)
  * @param {function} callback Called with error, if applicable
  * @private
  */
  __saveAll__(callback) {

    let firstErrorModel = this.filter(m => m.hasErrors()).shift();

    if (firstErrorModel) {
      return callback.call(this, firstErrorModel.errorObject());
    }

    async.series(
      this.map(m => m.__verify__.bind(m)),
      (err) => {

        if (err) {
          return callback.call(this, err);
        }

        let db = this.Model.prototype.db;

        db.transaction(
          this.map(m => {
            let query = m.__generateSaveQuery__();
            return [query.sql, query.params];
          }),
          (err, result) => {

            if (err) {
              return callback.call(this, new Error(err.message));
            }

            this.forEach((m, i) => {
              m.__load__(result[i].rows[0], true);
            });

            callback.call(this, null);

          }
        );

      }
    );

  }

}

module.exports = ModelArray;
