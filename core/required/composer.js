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
      where: []
    };

    this._total = 0;

  }

  ComposerQuery.prototype.where = function(filterObj) {

    if (this._select.where.length) {
      throw new Error('Can only specify .where once per ComposerQuery');
    }

    if (!(filterObj instanceof Array)) {
      filterObj = [].slice.call(arguments);
    }

    filterObj = filterObj.filter(function(v) {
      return Object.keys(v).length;
    });

    this._select.where = filterObj;

    return this;

  };

  ComposerQuery.prototype.externalQuery = function(callback) {

    var db = this._db;
    var table = this._table;
    var columns = this._columns;
    var extColumns = this._extColumns;

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
            multiFilter
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

    var composerQuery = this;

    var multiFilter = db.adapter.createMultiFilter(table, this._select.where);
    var params = db.adapter.getParamsFromMultiFilter(multiFilter);

    db.query(
      db.adapter.generateSelectQuery(
        table,
        columns,
        multiFilter
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
