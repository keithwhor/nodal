module.exports = (() => {

  'use strict';

  const anyDB = require('any-db');
  const beginTransaction = require('any-db-transaction');
  const async = require('async');
  const colors = require('colors/safe');

  const PostgresAdapter = require('./adapters/postgres.js');

  class Database {

    constructor() {

      this.adapter = new PostgresAdapter();
      this._connection = null;
      this._useLogColor = 0;

    }

    connect(cfg) {

      let connection;
      let connectionString = '';

      if (typeof cfg === 'string') {
        cfg = {connectionString: cfg};
      }

      if (cfg.connectionString) {
        connectionString = cfg.connectionString;
      } else {
        connectionString = this.adapter.generateConnectionString(cfg.host, cfg.port, cfg.database, cfg.user, cfg.password);
      }

      try {
        connection = anyDB.createPool(connectionString, {min: 2, max: 2});
      } catch (e) {
        throw new Error('Error Connecting to Database, Malformed Credentials');
      }

      this._connection = connection;
      this._config = cfg || {};

      return true;

    }

    close(callback) {

      this._connection && this._connection.close((err) => {
        this._connection = null;
        callback && callback.call(this, err);
      });

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
      let transaction = beginTransaction(this._connection);

      let queries = preparedArray.map(queryData => {

        queryData[1] = queryData[1] || [];

        return (next) => {
          db.log(queryData[0], queryData[1]);
          transaction.query(queryData[0], queryData[1], next);
        };

      });

      let transactionError = null;
      let transactionResults = [];

      transaction.on('error', (err) => {

        db.info('Transaction error');
        transactionError = err;

      });

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
        callback(transactionError, transactionResults);

      });

      db.info('Transaction started...');

      async.series(queries, (err, results) => {

        if (err) {
          transactionError = err;
          db.error(err.message);
          transaction.rollback();
        }

        transactionResults = results;

        transaction.commit();

      });

    }

    /* Command functions... */

    drop(databaseName, callback) {

      this.query(this.adapter.generateDropDatabaseQuery(databaseName), [], (err, result) => {

        if (err) {
          return callback(err);
        }

        this.info(`Dropped database "${databaseName}"`);
        callback(null);

      });

    }

    create(databaseName, callback) {

      this.query(this.adapter.generateCreateDatabaseQuery(databaseName), [], (err, result) => {

        if (err) {
          return callback(err);
        }

        this.info(`Created empty database "${databaseName}"`);
        callback(null);

      });

    }

  }

  Database.prototype.__logColorFuncs = [
    (str) => {
      return colors.yellow.bold(str);
    },
    (str) => {
      return colors.white(str);
    }
  ];

  return Database;

})();
