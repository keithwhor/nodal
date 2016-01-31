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
    },

    parseRegexFromString: (str) => {

      let names = [];

      if (str[str.length - 1] === '/') {
        str = str.substr(0, str.length - 1);
      }

      str = str.replace(/(?:(?:\/\{(\w+?)\/)\}|(\*))/g, (m, name, aster) => {
        names.push(name);
        return m === '*' ? '(.*?)' : '/([^\/]+?)/';
      });

      str = str.replace(/\/\{(\w+?)\}$/, (m, name) => {
        names.push(name);
        return '(?:/([^\/]+?))?'
      });

      str = str.replace(/\/\(\.\*\?\)/g, '(?:\/(.*?))?');

      return {
        regex: new RegExp(`^${str}/?$`),
        names: names
      };

    },

    isObject(value) {
      return typeof value === 'object' &&
        {}.toString.call(value) === '[object Object]';
    }

  };

})();
