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
      let replacements = [];

      if (str[str.length - 1] === '/') {
        str = str.substr(0, str.length - 1);
      }

      str = str.replace(/(\{(\w+?)\}|(\*))/g, (m, all, name) => {
        names.push(name);
        replacements.push((all === '*' ? '(.*?)' : '([^\/]+?)'));
        return `\{${replacements.length - 1}\}`;
      });

      str = str.replace(/\/\{([^\/]*?)\}$/g, (m, i) => {
        replacements[i | 0] = `(?:\/${replacements[i | 0]})?`;
        return `\{${i | 0}\}`;
      });

      let final = str.replace(/\{(.*?)\}/g, (m, i) => {
        return replacements[i | 0];
      });

      return {
        regex: new RegExp(`^${final}/?$`),
        names: names
      };

    },

    isObject(value) {
      return typeof value === 'object' &&
        {}.toString.call(value) === '[object Object]';
    },

    parseSize(size) {

      size = (size || '') + '';

      let match = size.match(/^(\d+(?:\.\d+)?)([kMG]?)B?$/);

      if (!match) {
        return 0;
      }

      let num = parseFloat(match[1]);
      let mag = match[2];

      num = num * {'': 1, 'k': 1024, 'M': 1024 * 1024, 'G': 1024 * 1024 * 1024}[mag];

      return Math.ceil(num) || 0;

    }

  };

})();
