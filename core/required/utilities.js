module.exports = (function() {

  'use strict';

  return {

    getFunctionParameters: (fn) => {
      return fn.toString()
        .replace(/\/\*.*?\*\//g, '')
        .replace(/\s+/g, '')
        .replace(/^function.*?(\(.*?\)).*/gi, '$1')
        .replace(/^(.*?)=>.*/g, '$1')
        .replace(/^\(?(.*?)\)?$/g, '$1')
        .split(',')
        .filter(v => !!v);
    }

  };

})();
