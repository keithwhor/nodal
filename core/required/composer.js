module.exports = (function() {

  'use strict';

  const ModelArray = require('./model_array.js');

  /**
  * The query composer (ORM)
  * @class
  */
  class Composer {

    /**
    * Created by Model#query, used for composing SQL queries based on Models
    * @param {Nodal.Model} Model The model class the composer is querying from
    * @param {Nodal.Composer} [parent=null] The composer's parent (another composer instance)
    */
    constructor(Model, parent) {

      this.db = Model.prototype.db;
      this.Model = Model;

      this._parent = parent || null;
      this._command = null;

    }

    /**
    * Given rows with repeated data (due to joining in multiple children), return only parent models (but include references to their children)
    * @private
    * @param {Array} rows Rows from sql result
    * @return {Nodal.ModelArray}
    */
    __parseModelsFromRows__(rows) {

      // console.log('START PARSE', rows.length);

      let s = new Date().valueOf();

      let models = new ModelArray(this.Model);

      let rowKeys = [];
      if (rows.length > 0) {(rowKeys = Object.keys(rows[0])); }

      // First, grab all the keys and multiple keys we need...
      let coreKeys = rowKeys.filter(key => key[0] !== '$');
      let joinSingleKeys = rowKeys.filter(key => key[0] === '$' && key[1] !== '$').map(key => key.substr(1));
      let joinMultipleKeys = rowKeys.filter(key => key[0] === '$' && key[1] === '$').map(key => key.substr(2));

      let reduceKeys = (prev, key) => {

        let i = key.indexOf('$');
        let joinName = key.substr(0, i);
        key = key.substr(i + 1);
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
          if (id === null) {
            return;
          }

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

          let modelArray = model.get(name) || model.set(name, new ModelArray(this.Model.joinInformation(name).Model));

          let id = row[`\$\$${name}\$id`];
          if (id === null) {
            return;
          }

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
            modelArray.push(cached);
          }

        });

      });

      // console.log('END PARSE', new Date().valueOf() - s);

      return models;

    }

    /**
    * Generate query information from the linked list of previous queries. Can squash multiple composer commands into a single query.
    * @private
    * @return {Object}
    */
    __generateQueryInformation__() {

      let composerArray = [];
      let composer = this;

      while (composer) {
        composerArray.unshift(composer);
        composer = composer._parent;
      }

      let joins = [];

      let commands = composerArray.reduce((p, c) => {

        let composerCommand = c._command || {type: 'where', data: {comparisons: []}};
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

    /**
    * Retrieve all joined column data for a given join
    * @private
    * @param {string} joinName The name of the join relationship
    */
    __joinedColumns__(joinName) {
      let joinsObject = this.Model.joinInformation(joinName);
      return joinsObject.Model.columnNames().map(columnName => {
        return {
          name: joinName,
          table: joinsObject.Model.table(),
          columnName: columnName,
          alias: `${(joinsObject.child && joinsObject.multiple) ? '$$' : '$'}${joinName}\$${columnName}`
        };
      });
    }

    /**
    * Generate a SQL query and its associated parameters from the current composer instance
    * @private
    * @return {Object} Has "params" and "sql" properties.
    */
    __generateQuery__() {

      let queryInfo = this.__generateQueryInformation__();

      return queryInfo.commands.concat({joins: queryInfo.joins}).reduce((prev, command, i) => {

        let table = !prev.sql ? this.Model.table() : `t${i}`;

        let multiFilter = this.db.adapter.createMultiFilter(table, command.where ? command.where.comparisons : []);
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

    /**
    * When using Composer#where, format all provided comparisons
    * @private
    * @param {Object} comparisons Comparisons object. {age__lte: 27}, for example.
    * @return {Array}
    */
    __parseComparisons__(comparisons) {

      let comparators = this.db.adapter.comparators;
      let columnLookup = this.Model.columnLookup();

      return Object.keys(comparisons)
        .map(comparison => {

          let column = comparison.split('__');
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
            value: comparisons[comparison],
            joined: joined,
            via: via,
            child: child
          };

        })
        .filter(v => {
          return !!v;
        });

    }

    /**
    * Add comparisons to SQL WHERE clause.
    * @param {Object} comparisons Comparisons object. {age__lte: 27}, for example.
    * @return {Nodal.Composer} new Composer instance
    */
    where(comparisonsArray) {

      if (!(comparisonsArray instanceof Array)) {
        comparisonsArray = [].slice.call(arguments);
      }

      comparisonsArray = comparisonsArray.map(comparisons => {
        return Object.keys(comparisons).reduce((p, c) => { return (p[c] = comparisons[c], p); }, {});
      });

      let order = null;
      let offset = null;
      let count = null;

      comparisonsArray.forEach(comparisons => {

        if ('__order' in comparisons) {
          order = comparisons.__order.split(' ');
          delete comparisons.__order;
        }

        if ('__offset' in comparisons || '__count' in comparisons) {
          offset = comparisons.__offset;
          count = comparisons.__count;
          delete comparisons.__offset;
          delete comparisons.__count;
        }

      });

      if (order || offset || count) {
        let composer = this;
        if (order) {(composer = composer.orderBy(order[0], order[1]));}
        if (count) {(composer = composer.limit(offset || 0, count || 0));}
        return composer.where(comparisonsArray);
      }

      this._command = {
        type: 'where',
        data: {
          comparisons: comparisonsArray
          .map(this.__parseComparisons__.bind(this))
          .filter(f => f.length)
        }
      };

      return new Composer(this.Model, this);

    }

    /**
    * Order by field belonging to the current Composer instance's model.
    * @param {string} field Field to order by
    * @param {string} direction Must be 'ASC' or 'DESC'
    * @return {Nodal.Composer} new Composer instance
    */
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

    /**
    * Limit to an offset and count
    * @param {number} offset The offset at which to set the limit. If this is the only argument provided, it will be the count instead.
    * @param {number} count The number of results to be returned. Can be omitted, and if omitted, first argument is used for count.
    * @return {Nodal.Composer} new Composer instance
    */
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

    /**
    * Join in a relationship. Must have Model.joinsTo() set from a child, or set to a parent
    * @param {string} joinName The name of the joined relationship
    */
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

    /**
    * Execute the query you've been composing.
    * @param {function({Error}, {Nodal.ModelArray})} callback The method to execute when the query is complete
    */
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
