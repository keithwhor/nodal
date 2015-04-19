var fs = require('fs');
var pg = require('pg');
var async = require('async')

var Database = require('../../core/module.js').Database;

var colors = require('colors/safe');

var MODEL_PATH = './app/models'
var MIGRATION_PATH = './db/migrations';

function generateModelQuery() {

  return fs.readdirSync(MODEL_PATH)
    .filter(function(filename) { return fs.statSync(MODEL_PATH + '/' + filename).isDirectory(); })
    .map(convertModelDataToSQL)
    .join(';');

};

function convertModelDataToSQL(filename) {

  var modelDef = require(MODEL_PATH + '/' + filename + '/definition.js');

  var model = new modelDef();

  return model.generateSQL();

};

function composeQueryFunc(query) {

  var cfg = Database.prototype.config;
  var conString = 'postgres://' + cfg.user + ':' + cfg.password + '@' + cfg.host + ':' + cfg.port + '/postgres';

  return function rawQuery(callback) {

    var client = new pg.Client(conString);

    client.connect(function(err) {

      if(err) {
        callback(err);
        return;
      }

      client.query(query, function(err, result) {

        client.end();
        callback(err);

      });

    });

  };

};

function dropDatabase(databaseName, callback) {
  return composeQueryFunc('DROP DATABASE IF EXISTS "' + databaseName + '"')(callback);
};

function createDatabase(databaseName, callback) {
  return composeQueryFunc('CREATE DATABASE "' + databaseName + '"')(callback);
};

function errorHandler(callback) {

  return function(err) {

    if (err) {
      console.error(colors.red.bold('ERROR: ') + err.message);
      return;
    }

    callback.apply(this, [].slice.call(arguments, 1));

  }

};

module.exports = {

  drop: function() {

    dropDatabase(
      Database.prototype.config.database,
      errorHandler(function() {

        Database.prototype.info('Dropped database');

      })
    );

  },

  create: function() {

    createDatabase(
      Database.prototype.config.database,
      errorHandler(function() {

        Database.prototype.info('Created empty database');
        process.exit(0);

      })
    );

  },

  prepare: function() {

    var db = new Database();

    db.transaction(
      'DROP SCHEMA public CASCADE;' +
      'CREATE SCHEMA public;' +
      'CREATE TABLE "schema_migrations"("id" BIGINT NOT NULL, PRIMARY KEY("id"))',
      errorHandler(function(result) {

        Database.prototype.info('Prepared database for migrations');
        process.exit(0);

      })
    );

  },

  migrate: function(args, flags) {

    var db = new Database();

    db.query('SELECT id FROM schema_migrations', function(err, result) {

      if (err) {
        db.error('Could not get schema migrations');
        process.exit(0);
      }

      var schema_ids = result.rows.map(function(v) { return v.id; });

      var migrations = fs.readdirSync(MIGRATION_PATH).map(function(v) {
        return {
          id: v.substr(0, v.indexOf('__')),
          migration: new (require(MIGRATION_PATH + '/' + v)(db))
        };
      }).filter(function(v) {
        return schema_ids.indexOf(v.id) === -1;
      });

      if (migrations.length === 0) {
        console.log('No pending migrations');
        process.exit(0);
      }

      var migrateFuncs = migrations.map(function(v) {

        var migrationInstance = v.migration;

        return function(callback) {
          migrationInstance.executeUp(function(err) {
            !err && migrationInstance.saveSchema();
            callback(err);
          });
        };

      });

      async.series(
        migrateFuncs,
        function(err) {

          if (err) {
            console.error(colors.red.bold('ERROR: ') + err.message);
            console.log('Migration could not be completed');
          } else {
            console.log('Migration complete!');
          }

          process.exit(0);

        }
      );

    });

  },

  rollback: function(args, flags) {

    var db = new Database();

    var steps = flags['step'] | 0;
    if (!steps) { steps = 1; }

    db.query('SELECT id FROM schema_migrations', function(err, result) {

      if (err) {
        db.error('Could not get schema migrations');
        process.exit(0);
      }

      var schema_ids = result.rows.map(function(v) { return v.id; });

      var migrations = fs.readdirSync(MIGRATION_PATH).map(function(v) {
        return {
          id: v.substr(0, v.indexOf('__')),
          migration: new (require(MIGRATION_PATH + '/' + v)(db))
        };
      }).filter(function(v) {
        return schema_ids.indexOf(v.id) !== -1;
      }).reverse();

      if (migrations.length === 0) {
        console.log('Could not find any completed migrations');
        process.exit(0);
      }

      var migrateFuncs = migrations.map(function(v, i) {

        var migrationInstance = v.migration;
        var nextMigrationInstanceId = migrations[i + 1] ? migrations[i + 1].migration.id : null;

        return function(callback) {
          migrationInstance.executeDown(function(err) {
            !err && migrationInstance.saveSchema(nextMigrationInstanceId);
            callback(err);
          });
        };

      }).slice(0, steps);

      async.series(
        migrateFuncs,
        function(err) {

          if (err) {
            console.error(colors.red.bold('ERROR: ') + err.message);
            console.log('Migration rollback could not be completed');
          } else {
            console.log('Migration rollback complete!');
          }

          process.exit(0);

        }
      );

    });

  }

};
