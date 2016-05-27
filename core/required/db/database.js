module.exports = (() => {

  'use strict';

  const async = require('async');
  const colors = require('colors/safe');

  const pg = require('pg');
  pg.defaults.poolSize = 8;

  const PostgresAdapter = require('./adapters/postgres.js');

  class Database {

    constructor() {

      this.adapter = new PostgresAdapter();
      this._connection = null;
      this._useLogColor = 0;

    }

    connect(cfg) {

      if (typeof cfg === 'string') {
        cfg = {connectionString: cfg};
      }

      if (cfg.connectionString) {
        cfg = this.adapter.parseConnectionString(cfg.connectionString);
      }

      this._config = cfg || {};

      return true;

    }

    close(callback) {

      pg.end();
      callback.call(this);

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

      pg.connect(this._config, (err, client, complete) => {

        if (err) {
          this.error(err.message);
          return complete();
        }

        client.query(query, params, (function () {

          log(query, params, new Date().valueOf() - start);
          complete();
          callback.apply(this, arguments);

        }).bind(this));

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

      let start = new Date().valueOf();

      pg.connect(this._config, (err, client, complete) => {

        if (err) {
          this.error(err.message);
          callback(err);
          return complete();
        }

        let queries = preparedArray.map(queryData => {

          let query = queryData[0];
          let params = queryData[1] || [];

          return (callback) => {
            this.log(query, params, new Date().valueOf() - start);
            client.query(queryData[0], queryData[1], callback);
          };

        });

        queries = [].concat(
          (callback) => {
            client.query('BEGIN', callback);
          },
          queries
        );

        this.info('Transaction started...');

        async.series(queries, (txnErr, results) => {

          if (txnErr) {

            this.error(txnErr.message);
            this.info('Rollback started...');

            client.query('ROLLBACK', (err) => {

              if (err) {
                this.error(`Rollback failed - ${err.message}`);
                this.info('Transaction complete!');
                complete();
                callback(err);
              } else {
                this.info('Rollback complete!')
                this.info('Transaction complete!');
                complete();
                callback(txnErr);
              };

            });

          } else {

            this.info('Commit started...');

            client.query('COMMIT', (err) => {

              if (err) {
                this.error(`Commit failed - ${err.message}`);
                this.info('Transaction complete!');
                complete();
                callback(err);
                return;
              }

              this.info('Commit complete!')
              this.info('Transaction complete!');
              complete();
              callback(null, results);

            });

          }

        });

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
