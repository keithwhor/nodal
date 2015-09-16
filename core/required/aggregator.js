module.exports = (function() {

  'use strict';

  class Aggregator {

    constructor(field) {

      // what?

    }

  }

  Aggregator.prototype.aggregates = {
    sum: (data, key) => data.reduce((prev, row) => prev + parseFloat(row[key]), 0),
    avg: (data, key) => data.reduce((prev, row) => prev + parseFloat(row[key]), 0) / data.length,
    min: (data, key) => data.reduce((min, row) => (min === undefined) ? row[key] : (min < row[key] ? max : row[key])),
    max: (data, key) => data.reduce((max, row) => (max === undefined) ? row[key] : (max > row[key] ? max : row[key])),
    count: (data, key) => data.filter(row => row[k] !== null).length,
    distinct: (data, key) => data.reduce((map, row) => (map.set(row[k], true), map), new Map()).size,
    none: (data, key) => null
  };

  Aggregator.prototype.defaultAggregate = 'none';

  return Aggregator;

})();
