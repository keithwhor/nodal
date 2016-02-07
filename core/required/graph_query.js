module.exports = (() => {

  'use strict';

  const inflect = require('i')();
  const API = require('./api.js');

  class GraphQuery {

    constructor(str, Model) {

      let parsed = this.constructor.parse(str);

      console.log('parsed', parsed);

      this.identifier = Object.keys(parsed.structure)[0];
      this.name = inflect.singularize(this.identifier);
      this.multiple = this.identifier !== this.name;

      this.Model = Model || require(`${process.cwd()}/app/models/${this.name}.js`);

      this.structure = parsed.structure;
      this.joins = parsed.joins;

    }

    query(callback) {

      console.log('JOINS', this.joins);

      let query = this.Model.query().where(this.joins[this.identifier]);

      Object.keys(this.joins).forEach(joinName => {

        let joinNames = joinName.split('__');
        joinNames.shift();
        if (!joinNames.length) {
          return;
        }

        query = query.join(joinNames.join('__'), this.joins[joinName]);

      });

      query[['first', 'end'][this.multiple | 0]]((err, models) => {

        callback(err, models, this.structure[this.identifier]);

      });

    }

    /*

      Example:

      parent {
        id
        children(id: 5) {
          name,
          age
        }
      }

    */

    static parse(str, parents, joins) {

      let structure = {};
      parents = parents || [];
      joins = joins || {};

      let open = str.indexOf('{');
      if (open === -1) {
        throw new Error('Invalid Graph Query (Not Initialized)');
      }

      let title = str.substr(0, open);
      str = str.substring(open + 1, str.lastIndexOf('}'));

      let match = title.match(/^\s*(\w+)\s*(?:\((.*?)\))?\s*$/);

      if (!match) {
        throw new Error('Invalid Graph Query (No Model)');
      }

      let name = match[1];
      let query = match[2] || '';

      query = query.split(/\s*,\s*/).reduce((query, item) => {
        let vals = item.split(':').map(v => v.replace(/^\s*(.*)\s*$/g, '$1'));
        let key = vals[0];
        let val = vals.slice(1).join(':');
        key && (query[key] = val);
        return query;
      }, {});

      joins[parents.concat(name).join('__')] = query;

      structure[name] = [];

      while (str.length) {

        let brace = str.indexOf('{');
        let comma = str.indexOf(',');
        let i;

        if (brace !== -1 && (comma === -1 || brace < comma)) {

          i = brace;
          let count = 1;
          while (count && str[i++]) {
            count += str[i] === '{' ? 1 : str[i] === '}' ? -1 : 0;
          }
          if (count) {
            throw new Error('Invalid Graph Query (SubQuery)');
          }
          let sub = this.parse(str.substr(0, i + 1), parents.concat(name), joins);
          structure[name].push(sub.structure);
          i = str.indexOf(',') > -1 ? str.indexOf(',') + 1 : i;

        } else {

          i = comma === -1 ? str.length : comma;

          let column = str.substr(0, i).replace(/\s+/g, '');
          structure[name].push(column);

        }

        str = str.substr(i + 1);

      }

      return {
        structure: structure,
        joins: joins
      };

    }

  }

  return GraphQuery;

})();
