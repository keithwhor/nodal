"use strict";

module.exports = (function() {

  const anyDB = require('any-db');
  const beginTransaction = require('any-db-transaction');
  const async = require('async');
  const colors = require('colors/safe');

  const PostgresAdapter = require('./adapters/postgres.js');

  class Database {

    constructor(cfg) {

      this.adapter = new PostgresAdapter();

      this._connection = null;

      this._useLogColor = 0;

    }

    connect(cfg) {

      let connection;

      if (cfg.connectionString) {
        connection = anyDB.createPool(cfg.connectionString, {min: 2, max: 20});
      } else {
        connection = anyDB.createPool(
          this.adapter.generateConnectionString(cfg.host, cfg.port, cfg.database, cfg.user, cfg.password),
          {min: 2, max: 20}
        );
      }

      this._connection = connection;

      return true;

    }

    close(callback) {

      this._connection && this._connection.close((function(err) {
        this._connection = null;
        callback.call(this, err);
      }).bind(this));

      return true;

    }

    log(sql, params, time) {

      let colorFunc = this.__logColorFuncs[this._useLogColor];

      console.log();
      console.log(colorFunc(sql));
      params && console.log(colorFunc(JSON.stringify(params)));
      time && console.log(colorFunc(time + 'ms'));
      console.log();

      this._useLogColor = (this._useLogColor + 1) % this.__logColorFuncs.length;

      return true;

    }

    info(message) {

      console.log(colors.green.bold('Database Info: ') + message);

    }

    error(message) {

      console.log(colors.red.bold('Database Error: ') + message);

      return true;

    }

    query(query, params, callback) {

      if (arguments.length < 3) {
        throw new Error('.query requires 3 arguments');
      }

      if (!(params instanceof Array)) {
        throw new Error('params must be a valid array');
      }

      if(typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      let start = new Date().valueOf();
      let log = this.log.bind(this);

      this._connection.query(query, params, function() {
        log(query, params, new Date().valueOf() - start);
        callback.apply(this, arguments);
      });

      return true;

    }

    transaction(preparedArray, callback) {

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

      let db = this;
      let _transaction = beginTransaction(this._connection);

      let queries = preparedArray.map(queryData => {

        queryData[1] = queryData[1] || [];

        return (next) => {
          db.log(queryData[0], queryData[1]);
          _transaction.query(queryData[0], queryData[1], next);
        };

      });

      let transactionError = null;
      let transactionResults = [];

      _transaction.on('rollback:start', function() {

        db.info('Rollback started...');

      });

      _transaction.on('rollback:complete', function() {

        db.info('Rollback complete!');

      });

      _transaction.on('commit:start', function() {

        db.info('Commit started...');

      });

      _transaction.on('commit:complete', function() {

        db.info('Commit complete!');

      });

      _transaction.on('close', function() {

        db.info('Transaction complete!');
        callback(transactionError, transactionResults);

      });

      db.info('Transaction started...');

      async.series(queries, (err, results) => {

        if (err) {
          transactionError = err;
          db.error(err.message);
          _transaction.rollback();
        }

        transactionResults = results;

        _transaction.commit();

      });

    }

  }

  Database.prototype.__logColorFuncs = [
    function(str) {
      return colors.yellow.bold(str);
    },
    function(str) {
      return colors.white(str);
    }
  ];

  return Database;

})();
