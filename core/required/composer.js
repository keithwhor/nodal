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
      filters: [],
      limit: {count: null, offset: 0},
      order: []
    };

    this._total = 0;

  }

  ComposerQuery.prototype.filter = function(filterObj) {

    this._select.filters.push(filterObj);
    return this;

  };

  ComposerQuery.prototype.limit = function(offset, count) {

    if (count === undefined) {
      this._select.limit.count = offset;
      return this;
    }

    this._select.limit.offset = offset;
    this._select.limit.count = count;

    return this;

  };

  ComposerQuery.prototype.order = function(columnName, dir) {

    dir = {'ASC': 1, 'DESC': 1}[dir] ? dir : 'ASC';
    this._select.order.push([columnName, dir]);

    return this;

  };

  ComposerQuery.prototype.externalQuery = function(callback) {

    var db = this._db;
    var table = this._table;
    var columns = this._columns;
    var extColumns = this._extColumns;

    var composerQuery = this;

    db.query(
      db.adapter.generateCountQuery(
        table,
        columns[0]
      ),
      [],
      function(err, result) {

        if (err) {
          callback.call(composerQuery, err, new ComposerResult(composerQuery, err, result));
          return;
        }

        composerQuery._total = parseInt(result.rows[0].__total__) || 0;

        db.query(
          db.adapter.generateSelectQuery(
            table,
            extColumns
          ),
          [],
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

    db.query(
      db.adapter.generateSelectQuery(
        table,
        columns
      ),
      [],
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
