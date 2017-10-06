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
  from(arr) {

    if (!arr) {
      throw new Error('Cannot create ModelArray from empty Array');
    }
    return arr.reduce((accum, model) =>
      accum.concat(new this.Model(model))
    , new ModelArray(this.model));
    // return modelArray;

  }


  /**
  * Creates an Array of plain objects from the ModelArray, with properties matching an optional interface
  * @param {Array} arrInterface Interface to use for object creation for each model
  */
  toObject(arrInterface) {

    return Array.from(this).map(m => m.toObject(arrInterface));

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
  * Calls Model#set on each Model in the ModelArray
  * @param {string} field Field to set
  * @param {any} value Value for the field
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
  * Saves / updates all models in the ModelArray.
  * @param {function} callback returning the error and reference to self
  */
  saveAll(callback, txn) {

    if (!this.length) {
      return callback.call(this, null, this);
    }

    let series = [];

    let newTransaction = !txn;
    if (newTransaction) {
      series = series.concat(
        cb => {
          this.Model.transaction((err, newTxn) => {
            if (err) {
              cb(err);
            }
            txn = newTxn;
            return cb();
          });
        }
      );
    }

    async.series(
      series.concat(this.map(m => cb => m.save(cb, txn))),
      (err) => {

        if (newTransaction) {
          if (err) {
            return txn.rollback(txnErr => callback(err, this));
          }
          return txn.commit(txnErr => callback(txnErr, this));
        }

        return callback(err, this);

      }
    );

  }

}

module.exports = ModelArray;
