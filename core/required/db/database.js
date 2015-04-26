module.exports = (function() {

  var anyDB = require('any-db-postgres');
  var beginTransaction = require('any-db-transaction');

  var async = require('async');

  var colors = require('colors/safe');

  var PostgresAdapter = require('./adapters/postgres.js');

  var Model = require('../model.js');
  var Config = require('../config.js');

  function Database(cfg) {

    this.adapter = new PostgresAdapter();

    this._connection = null;

    this._useLogColor = 0;

  }

  Database.prototype.connect = function(cfg) {
    this._connection = anyDB.createConnection(
      this.adapter.generateConnectionString(cfg.host, cfg.port, cfg.database, cfg.user, cfg.password)
    );
  };

  Database.prototype.__logColorFuncs = [
    function(str) {
      return colors.yellow.bold(str);
    },
    function(str) {
      return colors.white(str);
    }
  ];

  Database.prototype.log = function(sql, params) {

    if (Config.env !== 'development') {
      return;
    }

    var colorFunc = this.__logColorFuncs[this._useLogColor];

    console.log();
    console.log(colorFunc(sql));
    params && console.log(colorFunc(JSON.stringify(params)));
    console.log();

    this._useLogColor = (this._useLogColor + 1) % this.__logColorFuncs.length;

    return true;

  };

  Database.prototype.info = function(message) {

    console.log(colors.green.bold('Database Info: ') + message);

  };

  Database.prototype.error = function(message) {

    if (global.settings.ENV !== 'development') {
      return;
    }

    console.log(colors.red.bold('Database Error: ') + message);

    return true;

  };

  Database.prototype.query = function(query, params, callback) {

    if (!(params instanceof Array)) {
      callback = params;
      params = undefined;
    }

    if(typeof callback !== 'function') {
      callback = function() {};
    }

    this.log(query, params);

    if (params) {
      this._connection.query(query, params, callback);
      return;
    }

    this._connection.query(query, callback);
    return;

  };

  Database.prototype.transaction = function(preparedArray, callback) {

    if (!preparedArray.length) {
      throw new Error('Must give valid array of statements (with or without parameters)');
    }

    if (typeof preparedArray === 'string') {
      preparedArray = preparedArray.split(';').filter(function(v) {
        return !!v;
      }).map(function(v) {
        return [v];
      });
    }

    if(typeof callback !== 'function') {
      callback = function() {};
    }

    var db = this;
    var transaction = beginTransaction(this._connection);

    var queries = preparedArray.map(function(queryData, i) {

      if (queryData[1]) {

        if (i > 0) {

          return function(result, next) {
            db.log(queryData[0], queryData[1]);
            transaction.query(queryData[0], queryData[1], next);
          };

        }

        return function(next) {
          db.log(queryData[0], queryData[1]);
          transaction.query(queryData[0], queryData[1], next);
        };

      } else {

        if (i > 0) {

          return function(result, next) {
            db.log(queryData[0]);
            transaction.query(queryData[0], next);
          };

        }

        return function(next) {
          db.log(queryData[0]);
          transaction.query(queryData[0], next);
        };

      }

    });

    var transactionError = null;

    transaction.on('rollback:start', function() {

      db.info('Rollback started...');

    });

    transaction.on('rollback:complete', function() {

      db.info('Rollback complete!');

    });

    transaction.on('commit:start', function() {

      db.info('Commit started...');

    });

    transaction.on('commit:complete', function() {

      db.info('Commit complete!');

    });

    transaction.on('close', function() {

      db.info('Transaction complete!');

      callback(transactionError);

    });

    db.info('Transaction started...');

    async.waterfall(queries, function(err) {

      if (err) {
        transactionError = err;
        db.error(err.message);
        transaction.rollback();
      }

      transaction.commit();

    });

  };

  Database.prototype.saveModel = function(model, callback) {

    if (!(model instanceof Model)) {
      throw new Error('Can only save valid models.');
    }

    if(typeof callback !== 'function') {
      callback = function() {};
    }

    if (model.hasErrors()) {
      setTimeout(callback.bind(model, model.getErrors(), model), 1);
      return;
    }

    var columns = model.fieldList().filter(function(v) {
      return !model.isFieldPrimaryKey(v);
    }).filter(function(v) {
      return model.get(v) !== null;
    });

    var db = this;

    db.query(
      db.adapter.generateInsertQuery(model.schema.table, columns),
      columns.map(function(v) {
        return db.adapter.sanitize(model.getFieldData(v).type, model.get(v));
      }),
      function(err, result) {

        if (err) {
          model.error('_query', err.message);
        } else {
          result.rows.length && model.load(result.rows[0]);
        }

        callback.call(model, model.hasErrors() ? model.getErrors() : null, model);

    });

  };

  return Database;

})();
