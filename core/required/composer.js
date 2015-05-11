module.exports = (function() {

  var Model = require('./model.js');
  var Database = require('./db/database.js');
  var ComposerResult = require('./composer_result.js');

  function ComposerQuery(db, modelConstructor) {

    this._db = db;
    this._modelConstructor = modelConstructor;
    this._table = modelConstructor.prototype.schema.table;
    this._columns = modelConstructor.prototype.schema.columns.map(function(v) { return v.name; });
    this._extColumns = modelConstructor.prototype.externalInterface.slice();

    this._select = {
      where: [],
      orderBy: [],
      limit: null
    };

    this._total = 0;
    this._defaultCount = 500;

  }

  ComposerQuery.prototype.where = function(filterObj) {

    if (this._select.where.length) {
      throw new Error('Can only specify .where once per ComposerQuery');
    }

    if (!(filterObj instanceof Array)) {
      filterObj = [].slice.call(arguments);
    }

    filterObj = filterObj.map((function(v) {
      var copy = {};
      Object.keys(v).forEach(function(k) {
        copy[k] = v[k];
      });
      copy.hasOwnProperty('__order') &&
        this.orderBy(copy.__order),
        delete copy.__order;
      (copy.hasOwnProperty('__offset') || copy.hasOwnProperty('__count')) &&
        this.limit(copy.__offset || 0, copy.__count || this._defaultCount),
        delete copy.__offset,
        delete copy.__count;
      return copy;
    }).bind(this)).filter(function(v) {
      return Object.keys(v).length;
    });

    this._select.where = filterObj;

    return this;

  };

  ComposerQuery.prototype.orderBy = function(orderObj) {

    if (this._select.orderBy.length) {
      throw new Error('Can only specify .orderBy once per ComposerQuery');
    }

    if (!(orderObj instanceof Array)) {
      orderObj = [].slice.call(arguments);
    }

    orderObj = orderObj.map(function(v) {
      v = v.split(' ');
      return {columnName: v[0], direction: v[1] || 'ASC'};
    });

    this._select.orderBy = orderObj;

    return this;

  };

  ComposerQuery.prototype.limit = function(offset, count) {

    if (this._select.limit) {
      throw new Error('Can only specify .limit once per ComposerQuery');
    }

    this._select.limit = {
      offset: parseInt(offset) || 0,
      count: parseInt(count) || this._defaultCount
    };

    return this;

  };

  ComposerQuery.prototype.externalQuery = function(callback) {

    var db = this._db;
    var table = this._table;
    var columns = this._columns;
    var extColumns = this._extColumns;
    var select = this._select;

    var composerQuery = this;

    var multiFilter = db.adapter.createMultiFilter(table, this._select.where);
    var params = db.adapter.getParamsFromMultiFilter(multiFilter);

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

            var rows = result ? (result.rows || []).slice() : [];
            callback.call(composerQuery, err, new ComposerResult(composerQuery, err, rows));

          }
        );

      }
    );

  };

  ComposerQuery.prototype.query = function(callback) {

    var db = this._db;
    var table = this._table;
    var columns = this._columns;
    var modelConstructor = this._modelConstructor;
    var select = this._select;

    var composerQuery = this;

    var multiFilter = db.adapter.createMultiFilter(table, this._select.where);
    var params = db.adapter.getParamsFromMultiFilter(multiFilter);

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

        var rows = result ? (result.rows || []).slice() : [];
        var models = rows.map(function(v) {
          return new modelConstructor(v, true);
        });

        callback.call(composerQuery, err, models);

      }
    );

  };

  function Composer() {}

  Composer.prototype.from = function(db, modelConstructor) {

    if (!(db instanceof Database)) {
      throw new Error('Composer queries require valid database');
    }

    if (!Model.prototype.isPrototypeOf(modelConstructor.prototype)) {
      throw new Error('Composer queries require valid Model constructor');
    }

    return new ComposerQuery(db, modelConstructor);

  };

  return Composer;

})();
