'use strict';

module.exports = {
  serial: {
    convert: function(v) {
      return Math.max(Math.min(parseInt(v) || 0, Number.MAX_SAFE_INTEGER), Number.MIN_SAFE_INTEGER);
    }
  },
  int: {
    convert: function(v) {
      return Math.max(Math.min(parseInt(v) || 0, Number.MAX_SAFE_INTEGER), Number.MIN_SAFE_INTEGER);
    }
  },
  currency: {
    convert: function(v) {
      return Math.max(Math.min(parseInt(v) || 0, Number.MAX_SAFE_INTEGER), Number.MIN_SAFE_INTEGER);
    }
  },
  float: {
    convert: function(v) {
      return parseFloat(v) || 0;
    }
  },
  string: {
    convert: function(v) {
      return v === null ? '' : (v + '');
    }
  },
  text: {
    convert: function(v) {
      return v === null ? '' : (v + '');
    }
  },
  datetime: {
    convert: function(v) {
      if(!(v instanceof Date)) {
        v = new Date(v);
        if(v.toString() === 'Invalid Date') {
          v = new Date(0);
        }
      }
      return v;
    }
  },
  boolean: {
    convert: function(v) {
      return typeof v === 'string' ? [true, false][({'f':1,'false':1,'n':1,'no':1,'off':1,'0':1,'':1}[v]|0)] : !!v;
    }
  },
  json: {
    convert: function(v) {
      return typeof v === 'string' ? JSON.parse(v) : v;
    }
  }
};
