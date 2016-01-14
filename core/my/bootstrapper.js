module.exports = (() => {

  'use strict';

  const fs = require('fs');
  const async = require('async');

  const Database = require('../required/db/database.js');
  const SchemaGenerator = require('../required/db/schema_generator.js');

  const ModelFactory = require('../required/model_factory.js');

  const Config = require('./config.js');

  const MIGRATION_PATH = './db/migrations';

  class Bootstrapper {

    constructor() {

      this.cfg = Config.db.main;
      this.rootCfg = Object.create(this.cfg);
      this.rootCfg.database = 'postgres';

      this.rootDb = new Database();
      this.rootDb.connect(this.rootCfg);

      this.db = new Database();
      this.db.connect(this.cfg);

    }

    create(callback) {

      this.rootDb.create(this.cfg.database, callback);

    }

    drop(callback) {

      this.rootDb.drop(this.cfg.database, callback);

    }

    prepare(callback) {

      let schema = new SchemaGenerator(this.db);

      this.db.transaction(
        [
          this.db.adapter.generateClearDatabaseQuery(),
          this.db.adapter.generateCreateTableQuery('schema_migrations', [
            {name: 'id', type: 'int', properties: {nullable: false, primary_key: true}},
            {name: 'schema', type: 'string'}
          ])
        ].join(';'),
        (err, result) => {

          if (err) {
            return callback(err);
          }

          this.db.info(`Prepared database "${this.db._config.database}" for migrations`);
          schema.save();

          callback(null);

        }
      );

    }

    version(callback) {

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

      this.db.query(
        this.db.adapter.generateSelectQuery(
          null,
          'schema_migrations',
          ['id'],
          null,
          null,
          orderClause,
          limitClause
        ),
        [],
        (err, result) => {

          if (err) {
            return callback(new Error('Could not get schema migration version'));
          }

          if (result.rows && result.rows.length) {
            console.log(colors.green.bold('Current Schema Version: ') + result.rows[0].id);
          } else {
            return callback(new Error('No Migrations have been run'));
          }

          callback(null);

        }
      );

    }

    migrate(steps, callback) {

      steps = steps || 0;

      this.db.query(this.db.adapter.generateSelectQuery(null, 'schema_migrations', ['id']), [], (err, result) => {

        if (err) {
          return callback(new Error('Could not get schema migrations'));
        }

        if (!fs.existsSync(MIGRATION_PATH)) {
          return callback(new Error(`No migrations in "${MIGRATION_PATH}"`))
        }

        let schema_ids = result.rows.map((v) => { return v.id; });

        let migrations = fs.readdirSync(MIGRATION_PATH).map((v) => {
          return {
            id: parseInt(v.substr(0, v.indexOf('__'))),
            migration: new (require(process.cwd() + '/' + MIGRATION_PATH + '/' + v))(this.db)
          };
        });

        migrations = migrations.filter((v) => {
          return schema_ids.indexOf(v.id) === -1;
        });

        if (migrations.length === 0) {
          return callback(new Error('No pending migrations'));
        }

        let migrateFuncs = migrations.map((v) => {

          let migrationInstance = v.migration;

          return (callback) => {
            migrationInstance.executeUp(callback);
          };

        });

        if (steps) {
          migrateFuncs = migrateFuncs.slice(0, steps);
        }

        async.series(
          migrateFuncs,
          (err) => {

            if (err) {
              return callback(err);
            }

            console.log('Migration complete!');
            callback(null);

          }
        );

      });

    }

    rollback(steps, callback) {

      steps = steps || 1;

      this.db.query(this.db.adapter.generateSelectQuery(null, 'schema_migrations', ['id']), [], (err, result) => {

        if (err) {
          return callback(new Error('Could not get schema migrations'));
        }

        if (!fs.existsSync(MIGRATION_PATH)) {
          return callback(new Error(`No migrations in "${MIGRATION_PATH}"`))
        }

        let schema_ids = result.rows.map((v) => { return v.id; });

        let migrations = fs.readdirSync(MIGRATION_PATH).map((v) => {
          return {
            id: parseInt(v.substr(0, v.indexOf('__'))),
            migration: new (require(process.cwd() + '/' + MIGRATION_PATH + '/' + v))(this.db)
          };
        }).filter((v) => {
          return schema_ids.indexOf(v.id) !== -1;
        }).reverse();

        if (migrations.length === 0) {
          return callback(new Error('Could not find any completed migrations'));
        }

        let migrateFuncs = migrations.map((v, i) => {

          let migrationInstance = v.migration;
          let nextMigrationInstanceId = migrations[i + 1] ? migrations[i + 1].migration.id : null;

          return (callback) => {
            migrationInstance.executeDown(callback, nextMigrationInstanceId);
          };

        }).slice(0, steps);

        async.series(
          migrateFuncs,
          (err) => {

            if (err) {
              return callback(new Error('Migration rollback could not be completed'));
            }

            console.log('Migration rollback complete!');
            callback(null);

          }
        );

      });

    }

    seed(callback) {

      let seed = Config.seed;

      if (!seed) {
        return callback(new Error('Could not seed, no seed found in "./config/seed.json"'));
      }

      return ModelFactory.populate(seed, callback);

    }

    bootstrap(callback) {

      async.series([
        (cb) => this.prepare(cb),
        (cb) => this.migrate(0, cb),
        (cb) => this.seed(cb)
      ], (err) => {

        callback(err || null);

      });

    }

  }

  return new Bootstrapper();

})();
