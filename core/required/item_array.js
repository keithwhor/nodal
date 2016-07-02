'use strict';

const async = require('async');

/**
* Array of Items, for easy conversion to Objects
* @class
*/
class ItemArray extends Array {

  /**
  * Create the ItemArray
  */
  constructor() {

    super();
    this._meta = {
      total: 0,
      offset: 0
    };

  }

  /**
  * Convert a normal Array into a ItemArray
  * @param {Array} arr The array of child objects
  */
  static from(arr) {

    let itemArray = new this();
    itemArray.push.apply(itemArray, arr);

    return itemArray;

  }

  /**
  * Sets metadata for the modelArray
  * @param {Object} data values to set
  */
  setMeta(data) {

    Object.keys(data).forEach(k => this._meta[k] = data[k]);
    return this._meta;

  }

  /**
  * Creates an Array of plain objects from the ModelArray, with properties matching an optional interface
  * @param {Array} arrInterface Interface to use for object creation for each model
  */
  toObject(arrInterface) {

    let keys = [];

    if (this.length) {

      keys = Object.keys(this[0]);

      if (arrInterface && arrInterface.length) {
        keys = keys.filter(k => (arrInterface.indexOf(k) !== -1));
      }

    }

    return this.map(m => {
      return keys.reduce((p, k) => {
        p[k] = m[k];
        return p;
      }, {});
    });

  }

}

module.exports = ItemArray;
