module.exports = (function() {

  'use strict';

  const utilities = require('./utilities.js');

  /**
  * StrongParam are what the router uses to actually instantiate Controllers
  * @class
  */
  class StrongParam {

    /**
    * @param {props} object Properties
    */
    constructor(props) {

      if (props instanceof StrongParam) {
        return props;
      }

      Object.keys(props).forEach((key) => {
        Object.defineProperty(this, key, {
          enumerable: true,
          value: utilities.isObject(props[key])  ? new StrongParam(props[key]) : props[key],
          writable: true
        });
      });

    }

    except() {
      let list = Array.prototype.slice.call(arguments);

      let filteredObject = {};
      Object.keys(this).forEach( key => {
        if ( list.indexOf(key) === -1 ) {
          if (utilities.isObject(this[key])) {
            filteredObject[key] = this[key].except.apply(this[key], arguments)
          } else {
            filteredObject[key] = this[key];
          }
        }

      });

      return new StrongParam(filteredObject);

    }

    permit() {
      let list = Array.prototype.slice.call(arguments);

      let filteredObject = {};
      Object.keys(this).forEach( key => {
        if ( list.indexOf(key) !== -1 ) {
          if (utilities.isObject(this[key])) {
            filteredObject[key] = this[key].permit.apply(this[key], arguments)
          } else {
            filteredObject[key] = this[key];
          }
        }

      });

      return new StrongParam(filteredObject);

    }

    toObject() {
      let flattenedObject = {};
      Object.keys(this).forEach( key => {
          if (this[key] instanceof StrongParam) {
            flattenedObject[key] = this[key].toObject()
          } else {
            flattenedObject[key] = this[key];
          }
      });
      return flattenedObject;
    }



  };


  return StrongParam;

})();
