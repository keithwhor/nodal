module.exports = (function() {

  'use strict';

  const ModelArray = require('../model_array.js');
  const utilities = require('../utilities.js');

  class Composer {

    constructor(Model, parent) {

      this.db = Model.prototype.db;
      this.Model = Model;

      this._parent = parent || null;
      this._command = null;

    }

    __parseModelsFromRows__(rows) {

      // console.log('START PARSE', rows.length);

      let s = new Date().valueOf();

      let models = new ModelArray(this.Model);

      let rowKeys = [];
      rows.length && (rowKeys = Object.keys(rows[0]));

      // First, grab all the keys and multiple keys we need...
      let coreKeys = rowKeys.filter(key => key[0] !== '$');
      let joinSingleKeys = rowKeys.filter(key => key[0] === '$' && key[1] !== '$').map(key => key.substr(1));
      let joinMultipleKeys = rowKeys.filter(key => key[0] === '$' && key[1] === '$').map(key => key.substr(2));

      let reduceKeys = (prev, key) => {

        let i = key.indexOf('$');
        let joinName = key.substr(0, i);
        key = key.substr(i + 1, 0);
        prev[joinName] = prev[joinName] || [];
        prev[joinName].push(key);
        return prev;

      };

      let joinSingle = joinSingleKeys.reduce(reduceKeys, {});
      let joinSingleNames = Object.keys(joinSingle);

      let joinMultiple = joinMultipleKeys.reduce(reduceKeys, {});
      let joinMultipleNames = Object.keys(joinMultiple);

      let rowCache = {};
      let objectCache = {};
      let rowObjectCache = {};

      rows.forEach(row => {

        let model = rowCache[row.id];
        let curRowObjectCache = rowObjectCache[row.id] = rowObjectCache[row.id] || {};

        if (!model) {
          model = rowCache[row.id] = new this.Model(row, true);
          models.push(model);
        }

        joinSingleNames.forEach(name => {

          let id = row[`\$${name}\$id`];

          objectCache[name] = objectCache[name] || {};
          let cached = objectCache[name][id];

          curRowObjectCache[name] = curRowObjectCache[name] || {};
          let cachedForRow = curRowObjectCache[name][id];

          if (!cached) {
            objectCache[name][id] = cached = new (this.Model.joinInformation(name).Model)(
              joinSingle[name].reduce((prev, key) => {
                prev[key] = row[`\$${name}\$${key}`];
                return prev;
              }, {}),
              true
            );
          }

          if (!cachedForRow) {
            curRowObjectCache[name][id] = cachedForRow = cached;
            model.set(name, cached);
          }

        });

        joinMultipleNames.forEach(name => {

          let id = row[`\$\$${name}\$id`];

          objectCache[name] = objectCache[name] || {};
          let cached = objectCache[name][id];

          curRowObjectCache[name] = curRowObjectCache[name] || {};
          let cachedForRow = curRowObjectCache[name][id];

          if (!cached) {
            objectCache[name][id] = cached = new (this.Model.joinInformation(name).Model)(
              joinMultiple[name].reduce((prev, key) => {
                prev[key] = row[`\$\$${name}\$${key}`];
                return prev;
              }, {}),
              true
            );
          }

          if (!cachedForRow) {
            curRowObjectCache[name][id] = cachedForRow = cached;
            let modelArray = model.get(name) || model.set(name, new ModelArray(cached.constructor));
            modelArray.push(cached);
          }

        });

      });

      // console.log('END PARSE', new Date().valueOf() - s);

      return models;

    }

    __generateQueryInformation__() {

      let composerArray = [];
      let composer = this;

      while (composer) {
        composerArray.unshift(composer);
        composer = composer._parent;
      }

      let joins = [];

      let commands = composerArray.reduce((p, c) => {

        let composerCommand = c._command || {type: 'filter', data: {filters: []}};
        let lastCommand = p[p.length - 1];
        let command = {};

        if (lastCommand && !lastCommand[composerCommand.type]) {
          command = lastCommand;
        } else {
          p.push(command);
        }

        if (composerCommand.type === 'join') {

          joins.push(Object.keys(composerCommand.data).reduce((p, c) => {
            return (p[c] = composerCommand.data[c], p);
          }, {}));

        } else {

          command[composerCommand.type] = Object.keys(composerCommand.data).reduce((p, c) => {
            return (p[c] = composerCommand.data[c], p);
          }, {});

        }

        return p;

      }, []);

      return {
        commands: commands,
        joins: joins
      };

    }

    __joinedColumns__(joinName) {
      let joinsObject = this.Model.joinInformation(joinName);
      return joinsObject.Model.columnNames().map(columnName => {
        return {
          table: joinsObject.Model.table(),
          columnName: columnName,
          alias: `${(joinsObject.child ? joinsObject.multiple : joinsObject.via instanceof Array) ? '$$' : '$'}${joinName}\$${columnName}`
        };
      });
    }

    __generateQuery__() {

      let queryInfo = this.__generateQueryInformation__();

      return queryInfo.commands.concat({joins: queryInfo.joins}).reduce((prev, command, i) => {

        let table = !prev.sql ? this.Model.table() : `t${i}`;

        let multiFilter = this.db.adapter.createMultiFilter(table, command.filter ? command.filter.filters : []);
        let params = this.db.adapter.getParamsFromMultiFilter(multiFilter);

        let joins = null;
        let columns = this.Model.columnNames();

        let orderBy = command.orderBy ? [command.orderBy] : []

        // Only add in joins at the end
        if (command.joins) {

          joins = command.joins;

          joins.forEach(j => {
            columns = columns.concat(this.__joinedColumns__(j.name));
          });

        }

        return {
          sql: this.db.adapter.generateSelectQuery(
            prev.sql,
            table,
            columns,
            multiFilter,
            joins,
            orderBy,
            command.limit,
            prev.params.length
          ),
          params: prev.params.concat(params)
        }

      }, {sql: null, params: []});

    };

    __parseFilters__(filterObj) {

      let comparators = this.db.adapter.comparators;
      let columnLookup = this.Model.columnLookup();

      filterObj = Object.keys(filterObj).reduce((p, c) => { return (p[c] = filterObj[c], p); }, {});

      if ('__order' in filterObj) {
        let order = filterObj.__order.split(' ');
        delete filterObj.__order;
        return this.orderBy(order[0], order[1]).filter(filterObj);
      }

      if ('__offset' in filterObj || '__count' in filterObj) {
        let offset = filterObj.__offset;
        let count = filterObj.__count;
        delete filterObj.__offset;
        delete filterObj.__count;
        return this.limit(offset || 0, count || 0).filter(filterObj);
      }

      return Object.keys(filterObj)
        .map(filter => {

          let column = filter.split('__');
          let rel = this.Model.joinInformation(column[0]);

          let table = null;
          let via = null;
          let child = null;
          let joined = false;

          if (rel) {

            let joinName = column.shift();

            // if it's not found, return null...
            if (!rel.Model.hasColumn(column[0])) {
              return null;
            }

            table = rel.Model.table();
            child = rel.child;
            via = rel.via;
            joined = true;

            // Need this t be the following...

            `
            SELECT
              "id"
            FROM "parents"
            WHERE
              (SELECT "children"."id" FROM "children" WHERE "children"."parent_id" = "parent"."id" AND (/* joined filters */) LIMIT 1)
            `

          }

          let comparator = column.length > 1 ? column.pop() : 'is';
          let columnName = column.join('__');

          // block out bad column names
          if (!rel && !this.Model.hasColumn(columnName)) {
            return null;
          }

          if (!comparators[comparator]) {
            return null;
          }

          return {
            table: table,
            columnName: columnName,
            comparator: comparator,
            value: filterObj[filter],
            joined: joined,
            via: via,
            child: child
          };

        })
        .filter(v => {
          return !!v;
        });

    }

    filter(filters) {

      if (!(filters instanceof Array)) {
        filters = [].slice.call(arguments);
      }

      this._command = {
        type: 'filter',
        data: {
          filters: filters
          .map(this.__parseFilters__.bind(this))
          .filter(f => f.length)
        }
      };

      return new Composer(this.Model, this);

    }

    orderBy(field, direction, formatFunc) {

      if (!this.Model.hasColumn(field)) {
        throw new Error(`Cannot order by ${field}, it does not belong to ${this.Model.name}`);
      }

      if (typeof formatFunc !== 'function') {
        formatFunc = null;
      }

      this._command = {
        type: 'orderBy',
        data: {
          columnName: field,
          direction: ({'asc': 'ASC', 'desc': 'DESC'}[(direction + '').toLowerCase()] || 'ASC'),
          format: formatFunc
        }
      };

      return new Composer(this.Model, this);

    }

    limit(offset, count) {

      if (this._command) {
        return new Composer(this.Model, this).limit(offset, count);
      }

      if (count === undefined) {
        count = offset;
        offset = 0;
      }

      count = parseInt(count);
      offset = parseInt(offset);

      this._command = {
        type: 'limit',
        data: {
          count: count,
          offset: offset
        }
      };

      return new Composer(this.Model, this);

    }

    join(joinName) {

      if (!this.Model.hasJoin(joinName)) {
        throw new Error(`Model ${this.Model.name} does not have relationship ${joinName}`);
      }

      let composer = this;
      while (composer) {
        if (composer._command && composer._command.type === 'join' && composer._command.data.name === joinName) {
          return this;
        }
        composer = composer._parent;
      }

      let joinsObject = this.Model.joinInformation(joinName);

      this._command = {
        type: 'join',
        data: {
          name: joinName,
          table: joinsObject.Model.table(),
          field: joinsObject.child ? joinsObject.via : 'id',
          baseField: joinsObject.child ? 'id' : joinsObject.via
        }
      };

      return new Composer(this.Model, this);

    }

    end(callback) {

      let query = this.__generateQuery__();

      return this.db.query(query.sql, query.params, (err, result) => {

        let rows = result ? (result.rows || []).slice() : [];
        let models = this.__parseModelsFromRows__(rows);

        callback.call(this, err, models);

      });

    }

  }

  return Composer;

})();
