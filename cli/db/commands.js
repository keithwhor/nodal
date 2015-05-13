"use strict";

let fs = require('fs');
let pg = require('pg');
let async = require('async');
let Nodal = require('../../core/module.js');

let Database = Nodal.Database;
let SchemaGenerator = Nodal.SchemaGenerator;

let colors = require('colors/safe');

let MODEL_PATH = './app/models';
let MIGRATION_PATH = './db/migrations';

function composeQueryFunc(query) {

  let dbCredentials = Nodal.my.Config.db.main;

  let cfg = dbCredentials;
  let conString = 'postgres://' + cfg.user + ':' + cfg.password + '@' + cfg.host + ':' + cfg.port + '/postgres';

  return function rawQuery(callback) {

    let client = new pg.Client(conString);

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

}

function dropDatabase(databaseName, callback) {
  return composeQueryFunc('DROP DATABASE IF EXISTS "' + databaseName + '"')(callback);
}

function createDatabase(databaseName, callback) {
  return composeQueryFunc('CREATE DATABASE "' + databaseName + '"')(callback);
}

function errorHandler(callback) {

  return function(err) {

    if (err) {
      console.error(colors.red.bold('ERROR: ') + err.message);
      return;
    }

    callback.apply(this, [].slice.call(arguments, 1));

  };

}

module.exports = {

  drop: function() {

    let dbCredentials = Nodal.my.Config.db.main;

    dropDatabase(
      dbCredentials.database,
      errorHandler(function() {

        Database.prototype.info('Dropped database "' + dbCredentials.database + '"');

      })
    );

  },

  create: function() {

    let dbCredentials = Nodal.my.Config.db.main;

    createDatabase(
      dbCredentials.database,
      errorHandler(function() {

        Database.prototype.info('Created empty database "' + dbCredentials.database + '"');
        process.exit(0);

      })
    );

  },

  prepare: function() {

    let dbCredentials = Nodal.my.Config.db.main;

    let db = new Database();
    db.connect(dbCredentials);

    let schema = new SchemaGenerator(db);

    db.transaction(
      'DROP SCHEMA public CASCADE;' +
      'CREATE SCHEMA public;' +
      'CREATE TABLE "schema_migrations"("id" BIGINT NOT NULL, PRIMARY KEY("id"))',
      errorHandler(function(result) {

        Database.prototype.info('Prepared database for migrations');
        schema.save();
        process.exit(0);

      })
    );

  },

  migrate: function(args, flags) {

    let dbCredentials = Nodal.my.Config.db.main;

    let db = new Database();
    db.connect(dbCredentials);

    let steps = flags.step | 0;
    if (!steps) { steps = 0; }

    db.query('SELECT id FROM schema_migrations', [], function(err, result) {

      if (err) {
        db.error('Could not get schema migrations, try `nodal db:prepare` first');
        process.exit(0);
      }

      let schema_ids = result.rows.map(function(v) { return v.id; });

      let migrations = fs.readdirSync(MIGRATION_PATH).map(function(v) {
        return {
          id: parseInt(v.substr(0, v.indexOf('__'))),
          migration: new (require(process.cwd() + '/' + MIGRATION_PATH + '/' + v))(db)
        };
      }).filter(function(v) {
        return schema_ids.indexOf(v.id) === -1;
      });

      if (migrations.length === 0) {
        console.log('No pending migrations');
        process.exit(0);
      }

      let migrateFuncs = migrations.map(function(v) {

        let migrationInstance = v.migration;

        return function(callback) {
          migrationInstance.executeUp(callback);
        };

      });

      if (steps) {
        migrateFuncs = migrateFuncs.slice(0, steps);
      }

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

    let dbCredentials = Nodal.my.Config.db.main;

    let db = new Database();
    db.connect(dbCredentials);

    let steps = flags.step | 0;
    if (!steps) { steps = 1; }

    db.query('SELECT id FROM schema_migrations', [], function(err, result) {

      if (err) {
        db.error('Could not get schema migrations, try `nodal db:prepare` first');
        process.exit(0);
      }

      let schema_ids = result.rows.map(function(v) { return v.id; });

      let migrations = fs.readdirSync(MIGRATION_PATH).map(function(v) {
        return {
          id: parseInt(v.substr(0, v.indexOf('__'))),
          migration: new (require(process.cwd() + '/' + MIGRATION_PATH + '/' + v))(db)
        };
      }).filter(function(v) {
        return schema_ids.indexOf(v.id) !== -1;
      }).reverse();

      if (migrations.length === 0) {
        console.log('Could not find any completed migrations');
        process.exit(0);
      }

      let migrateFuncs = migrations.map(function(v, i) {

        let migrationInstance = v.migration;
        let nextMigrationInstanceId = migrations[i + 1] ? migrations[i + 1].migration.id : null;

        return function(callback) {
          migrationInstance.executeDown(callback, nextMigrationInstanceId);
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
