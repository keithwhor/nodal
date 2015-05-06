module.exports = (function() {

  var Model = require('./model.js');
  var Database = require('./db/database.js');

  function Composer() {

    this._db = null;

  }

  Composer.prototype.useDatabase = function(db) {

    if (!(db instanceof Database)) {
      throw new Error('Can only save a valid model');
    }

    this._db = db;

  };

  Composer.prototype.save = function(model, callback) {

    var db = this._db;

    if (!db) {
      throw new Error('Please set a Database for the composer using composer.useDatabase');
    }

    if (!(model instanceof Model)) {
      throw new Error('Can only save a valid model');
    }

    if(typeof callback !== 'function') {
      callback = function() {};
    }

    if (model.hasErrors()) {
      setTimeout(callback.bind(model, model.getErrors(), model), 1);
      return;
    }

    var columns, query;

    if (!model.inStorage()) {

      columns = model.fieldList().filter(function(v) {
        return !model.isFieldPrimaryKey(v) && model.get(v) !== null;
      });

      query = db.adapter.generateInsertQuery(model.schema.table, columns);

    } else {

      columns = ['id'].concat(model.changedFields().filter(function(v) {
        return !model.isFieldPrimaryKey(v);
      }));

      query = db.adapter.generateUpdateQuery(model.schema.table, columns);

    }

    db.query(
      query,
      columns.map(function(v) {
        return db.adapter.sanitize(model.getFieldData(v).type, model.get(v));
      }),
      function(err, result) {

        if (err) {
          model.error('_query', err.message);
        } else {
          result.rows.length && model.load(result.rows[0], true);
        }

        callback.call(model, model.errorObject(), model);

    });

  };

  return Composer;

})();
