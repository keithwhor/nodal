module.exports = (function() {

  'use strict';

  class Aggregator {

    constructor(field) {

      this._field = field;

    }

    aggregate(type, data) {

      if (typeof type === 'function') {
        return type(data, this._field);
      }

      type = (this.aggregates.indexOf(type) === -1) ? this.defaultAggregate : type;

      return this[type](data);

    }

    sum(data) {

      let k = this._field;

      return data.reduce(function(p, c) {
        return p + c[k];
      }, 0);

    }

    avg(data) {

      let k = this._field;

      return (data.reduce(function(p, c) {
        return p + c[k];
      }, 0) / data.length) || 0;

    }

    min(data) {

      let k = this._field;

      return data.reduce(function(min, v) {

        return (min === undefined) ? v[k] : (min < v[k] ? min : v[k]);

      });

    }

    max(data) {

      let k = this._field;

      return data.reduce(function(min, v) {

        return (min === undefined) ? v[k] : (min > v[k] ? min : v[k]);

      });

    }

    count(data) {

      return data.length;

    }

    distinct(data) {

      let k = this._field;

      let map = new Map();

      data.forEach(function(row) {
        map.set(row[k], true);
      });

      return map.size;

    }

  }

  Aggregator.prototype.aggregates = [
    'sum',
    'avg',
    'min',
    'max',
    'count',
    'distinct'
  ];

  Aggregator.prototype.defaultAggregate = 'max';

  return Aggregator;

})();
