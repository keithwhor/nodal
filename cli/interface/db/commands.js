"use strict";

let fs = require('fs');
let pg = require('pg');
let async = require('async');
let Nodal = require('../../../core/module.js');

let Database = Nodal.Database;
let SchemaGenerator = Nodal.SchemaGenerator;

let colors = require('colors/safe');

let MODEL_PATH = './app/models';
let MIGRATION_PATH = './db/migrations';

module.exports = {

  upgrade: function(args, flags, callback) {

    let dbCredentials = Nodal.my.Config.db.main;
    let cfg = dbCredentials;
    let conString = 'postgres://' + cfg.user + ':' + cfg.password + '@' + cfg.host + ':' + cfg.port + '/' + cfg.database;

    let db = new Database();
    db.connect({connectionString: conString});

    db.query(
      db.adapter.generateAlterTableAddColumnQuery(
        'schema_migrations',
        'schema',
        'string',
        {}
      ),
      [],
      function(err, result) {

        if (err) {
          return callback(err);
        }

        db.info('Added column "schema" to "schema_migrations"');

        let schema = new SchemaGenerator(db);
        schema.load();

        db.query(
          db.adapter.generateUpdateQuery('schema_migrations', ['id', 'schema']),
          [schema.migrationId, schema.generate()],
          function(err, result) {

            if (err) {
              return callback(err);
            }

            db.info('populated most recent "schema" in "schema_migrations"');
            callback(null);

          }
        )

      }
    );

  },

  drop: function(args, flags, callback) {

    let dbCredentials = Nodal.my.Config.db.main;
    let cfg = dbCredentials;
    let conString = 'postgres://' + cfg.user + ':' + cfg.password + '@' + cfg.host + ':' + cfg.port + '/postgres';

    let db = new Database();
    db.connect({connectionString: conString});

    db.query(db.adapter.generateDropDatabaseQuery(dbCredentials.database), [], function(err, result) {

      if (err) {
        return callback(err);
      }

      db.info('Dropped database "' + dbCredentials.database + '"');
      callback(null);

    });

  },

  create: function(args, flags, callback) {

    let dbCredentials = Nodal.my.Config.db.main;
    let cfg = dbCredentials;
    let conString = 'postgres://' + cfg.user + ':' + cfg.password + '@' + cfg.host + ':' + cfg.port + '/postgres';

    let db = new Database();
    db.connect({connectionString: conString});

    db.query(db.adapter.generateCreateDatabaseQuery(dbCredentials.database), [], function(err, result) {

      if (err) {
        return callback(err);
      }

      db.info('Created empty database "' + dbCredentials.database + '"');
      callback(null);

    });

  },

  prepare: function(args, flags, callback) {
    let dbCredentials = Nodal.my.Config.db.main;

    let db = new Database();
    db.connect(dbCredentials);

    let schema = new SchemaGenerator(db);

    db.transaction(
      [
        db.adapter.generateClearDatabaseQuery(),
        db.adapter.generateCreateTableQuery('schema_migrations', [
          {name: 'id', type: 'int', properties: {nullable: false, primary_key: true}},
          {name: 'schema', type: 'string'}
        ])
      ].join(';'),
      function(err, result) {

        if (err) {
          return callback(err);
        }

        Database.prototype.info('Prepared database "' + dbCredentials.database + '" for migrations');
        schema.save();

        callback(null);

      }
    );

  },

  version: function(args, flags, callback) {
    let dbCredentials = Nodal.my.Config.db.main;

    let db = new Database();
    db.connect(dbCredentials);

    // Query schema by the Id column, descending
    let orderClause = [{
      columnName: 'id',
      direction: 'desc'
    }];

    // Only fetch one row
    let limitClause = {
      offset: 0,
      count: 1
    }

    db.query(db.adapter.generateSelectQuery(null, 'schema_migrations', ['id'], null, null, orderClause, limitClause), [], function(err, result) {

      if (err) {
        return callback(new Error('Could not get schema migration version,  try `nodal db:prepare` first'));
      }

      if (result.rows && result.rows.length) {
        console.log(colors.green.bold('Current Schema Version: ') + result.rows[0].id);
      } else {
        return callback(new Error('No Migrations have been run, try `nodal db:migrate` first'));
      }

      callback(null);

    });

  },

  migrate: function(args, flags, callback) {

    let dbCredentials = Nodal.my.Config.db.main;

    let db = new Database();
    db.connect(dbCredentials);

    let steps = flags.step | 0;
    if (!steps) { steps = 0; }

    db.query(db.adapter.generateSelectQuery(null, 'schema_migrations', ['id']), [], function(err, result) {

      if (err) {
        return callback(new Error('Could not get schema migrations, try `nodal db:prepare` first'));
      }

      let schema_ids = result.rows.map(function(v) { return v.id; });

      let migrations = fs.readdirSync(MIGRATION_PATH).map(function(v) {
        return {
          id: parseInt(v.substr(0, v.indexOf('__'))),
          migration: new (require(process.cwd() + '/' + MIGRATION_PATH + '/' + v))(db)
        };
      });

      migrations = migrations.filter(function(v) {
        return schema_ids.indexOf(v.id) === -1;
      });

      if (migrations.length === 0) {
        return callback(new Error('No pending migrations'));
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
            return callback(err);
          }

          console.log('Migration complete!');
          callback(null);

        }
      );

    });

  },

  rollback: function(args, flags, callback) {

    let dbCredentials = Nodal.my.Config.db.main;

    let db = new Database();
    db.connect(dbCredentials);

    let steps = flags.step | 0;
    if (!steps) { steps = 1; }

    db.query(db.adapter.generateSelectQuery(null, 'schema_migrations', ['id']), [], function(err, result) {

      if (err) {
        return callback(new Error('Could not get schema migrations, try `nodal db:prepare` first'));
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
        return callback(new Error('Could not find any completed migrations'));
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
            return callback(new Error('Migration rollback could not be completed'));
          }

          console.log('Migration rollback complete!');
          callback(null);

        }
      );

    });

  }

};
