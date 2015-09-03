module.exports = (function() {

  'use strict';

  const Model = require('./model.js');
  const Database = require('./db/database.js');
  const ComposerResult = require('./composer_result.js');

  class ComposerQuery {

    constructor(db, modelConstructor) {

      this._db = db;
      this._modelConstructor = modelConstructor;
      this._table = modelConstructor.prototype.schema.table;
      this._columns = modelConstructor.prototype.schema.columns.map(function(v) { return v.name; });
      this._extColumns = modelConstructor.prototype.externalInterface.slice();

      let columnLookup = {};
      this._columns.forEach(function(v) {
        columnLookup[v] = true;
      });

      this._columnLookup = columnLookup;

      this._select = {
        where: [],
        orderBy: [],
        limit: null
      };

      this._total = 0;
      this._defaultCount = 500;

    }

    where(filterObj) {

      if (this._select.where.length) {
        throw new Error('Can only specify .where once per ComposerQuery');
      }

      if (!(filterObj instanceof Array)) {
        filterObj = [].slice.call(arguments);
      }

      filterObj = filterObj.map(this.parseFilters.bind(this)).filter(function(v) {
        return v.length;
      });

      this._select.where = filterObj;

      return this;

    }

    parseFilters(filterObj) {

      let comparators = this._db.adapter.comparators;
      let columnLookup = this._columnLookup;

      filterObj.hasOwnProperty('__order') &&
        this.orderBy(filterObj.__order);

      filterObj.hasOwnProperty('__offset') || filterObj.hasOwnProperty('__count') &&
        this.limit(filterObj.__offset || 0, filterObj.__count || this._defaultCount);

      return Object.keys(filterObj).map(function(filter) {
        let column = filter.split('__');
        let comparator = column.length > 1 ? column.pop() : 'is';
        column = column.join('__');
        return {
          columnName: column,
          comparator: comparator,
          value: filterObj[filter],
        };
      }).filter(function(v) {
        return columnLookup[v.columnName] && comparators[v.comparator];
      });

    }

    orderBy(orderObj) {

      if (this._select.orderBy.length) {
        throw new Error('Can only specify .orderBy once per ComposerQuery');
      }

      if (!(orderObj instanceof Array)) {
        orderObj = [].slice.call(arguments);
      }

      let columnLookup = this._columnLookup;

      orderObj = orderObj.map(function(v) {
        v = v.split(' ');
        return {columnName: v[0], direction: v[1] || 'ASC'};
      }).filter(function(v) {
        return columnLookup[v.columnName];
      });

      this._select.orderBy = orderObj;

      return this;

    }

    limit(offset, count) {

      if (typeof(count) === 'undefined') {
        count = offset;
        offset = 0;
      }

      if (this._select.limit) {
        throw new Error('Can only specify .limit once per ComposerQuery');
      }

      this._select.limit = {
        offset: parseInt(offset) || 0,
        count: parseInt(count) || this._defaultCount
      };

      return this;

    }

    find(id, callback) {

      let db = this._db;
      let table = this._table;
      let columns = this._columns;
      let modelConstructor = this._modelConstructor;

      let composerQuery = this;

      let multiFilter = db.adapter.createMultiFilter(table, [this.parseFilters({id: parseInt(id)})]);
      let params = db.adapter.getParamsFromMultiFilter(multiFilter);

      db.query(
        db.adapter.generateSelectQuery(
          table,
          columns,
          multiFilter
        ),
        params,
        function(err, result) {

          let rows = result ? (result.rows || []).slice() : [];
          let model = rows.map(function(v) {
            return new modelConstructor(v, true);
          }).pop() || null;

          err = err || (model ? null : {message: 'Resource does not exist'});

          callback.call(composerQuery, err, model);

        }
      );

    }

    externalQuery(callback) {

      let db = this._db;
      let table = this._table;
      let columns = this._columns;
      let extColumns = this._extColumns;
      let select = this._select;

      let composerQuery = this;

      let multiFilter = db.adapter.createMultiFilter(table, this._select.where);
      let params = db.adapter.getParamsFromMultiFilter(multiFilter);

      db.query(
        db.adapter.generateCountQuery(
          table,
          columns[0],
          multiFilter
        ),
        params,
        function(err, result) {

          if (err) {
            callback.call(composerQuery, err, new ComposerResult(composerQuery, err, result));
            return;
          }

          composerQuery._total = parseInt(result.rows[0].__total__) || 0;

          db.query(
            db.adapter.generateSelectQuery(
              table,
              extColumns,
              multiFilter,
              select.orderBy,
              select.limit
            ),
            params,
            function(err, result) {

              let rows = result ? (result.rows || []).slice() : [];
              callback.call(composerQuery, err, new ComposerResult(composerQuery, err, rows));

            }
          );

        }
      );

    }

    query(callback) {

      let db = this._db;
      let table = this._table;
      let columns = this._columns;
      let modelConstructor = this._modelConstructor;
      let select = this._select;

      let composerQuery = this;

      let multiFilter = db.adapter.createMultiFilter(table, this._select.where);
      let params = db.adapter.getParamsFromMultiFilter(multiFilter);

      db.query(
        db.adapter.generateSelectQuery(
          table,
          columns,
          multiFilter,
          select.orderBy,
          select.limit
        ),
        params,
        function(err, result) {

          let rows = result ? (result.rows || []).slice() : [];
          let models = rows.map(function(v) {
            return new modelConstructor(v, true);
          });

          callback.call(composerQuery, err, models);

        }
      );

    }

  }

  class Composer {

    from(db, modelConstructor) {

      if (!(db instanceof Database)) {
        throw new Error('Composer queries require valid database');
      }

      if (!Model.prototype.isPrototypeOf(modelConstructor.prototype)) {
        throw new Error('Composer queries require valid Model constructor');
      }

      return new ComposerQuery(db, modelConstructor);

    }

  };

  return Composer;

})();
