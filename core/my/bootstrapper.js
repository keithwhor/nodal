'use strict';

const fs = require('fs');
const async = require('async');
const colors = require('colors/safe');

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

  }

  rootDb() {

    let rootDb = new Database();
    rootDb.connect(this.rootCfg);
    return rootDb;

  }

  connect(callback) {

    let db = new Database();

    try {
      db.connect(this.cfg);
    } catch (e) {
      return callback(e);
    }

    callback(null, db);

  }

  create(callback) {

    this.rootDb().create(this.cfg.database, callback);

  }

  drop(callback) {

    this.rootDb().drop(this.cfg.database, callback);

  }

  prepare(callback) {

    this.connect((err, db) => {

      if (err) {
        return callback(err);
      }

      callback = this.wrapCallback(db, callback);

      let schema = new SchemaGenerator(db);

      db.transaction(
        [
          db.adapter.generateClearDatabaseQuery(),
          db.adapter.generateCreateTableQuery('schema_migrations', [
            {name: 'id', type: 'int', properties: {nullable: false, primary_key: true}},
            {name: 'schema', type: 'string'}
          ])
        ].join(';'),
        (err, result) => {

          if (err) {
            return callback(err);
          }

          schema.save();

          callback(null, `Prepared database "${db.adapter._config.database}" for migrations`);

        }
      );

    });

  }

  version(callback) {

    this.connect((err, db) => {

      if (err) {
        return callback(err);
      }

      callback = this.wrapCallback(db, callback);

      // Query schema by the Id column, descending
      let orderClause = [{
        columnNames: ['id'],
        direction: 'DESC'
      }];

      // Only fetch one row
      let limitClause = {
        offset: 0,
        count: 1
      }

      db.query(
        db.adapter.generateSelectQuery(
          null,
          'schema_migrations',
          ['id'],
          null,
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
            return callback(null, `Schema version: ${result.rows[0].id}`);
          } else {
            return callback(new Error('No Migrations have been run'));
          }

        }
      );

    });

  }

  migrate(steps, callback) {

    this.connect((err, db) => {

      if (err) {
        return callback(err);
      }

      callback = this.wrapCallback(db, callback);

      steps = steps || 0;

      db.query(db.adapter.generateSelectQuery(null, 'schema_migrations', ['id']), [], (err, result) => {

        if (err) {
          return callback(err);
        }

        if (!fs.existsSync(MIGRATION_PATH)) {
          return callback(db.info(`No migrations in "${MIGRATION_PATH}"`))
        } else {

          let schema_ids = result.rows.map((v) => { return v.id; });

          let migrations = fs.readdirSync(MIGRATION_PATH).map((v) => {
            return {
              id: parseInt(v.substr(0, v.indexOf('__'))),
              migration: new (require(process.cwd() + '/' + MIGRATION_PATH + '/' + v))(db)
            };
          });

          migrations = migrations.filter((v) => {
            return schema_ids.indexOf(v.id) === -1;
          });

          if (migrations.length === 0) {
            return callback(db.info('No pending migrations'));
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

              callback(null, 'Migration completed successfully');

            }
          );
        }

      });

    });

  }

  rollback(steps, callback) {

    this.connect((err, db) => {

      if (err) {
        return callback(err);
      }

      callback = this.wrapCallback(db, callback);

      steps = steps || 1;

      db.query(db.adapter.generateSelectQuery(null, 'schema_migrations', ['id']), [], (err, result) => {

        if (err) {
          return callback(err);
        }

        if (!fs.existsSync(MIGRATION_PATH)) {
          return callback(new Error(`No migrations in "${MIGRATION_PATH}"`))
        }

        let schema_ids = result.rows.map((v) => { return v.id; });

        let migrations = fs.readdirSync(MIGRATION_PATH).map((v) => {
          return {
            id: parseInt(v.substr(0, v.indexOf('__'))),
            migration: new (require(process.cwd() + '/' + MIGRATION_PATH + '/' + v))(db)
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

            callback(null, 'Migration rollback complete!');

          }
        );

      });

    });

  }

  seed(callback) {

    this.connect((err, db) => {

      if (err) {
        return callback(err);
      }

      callback = this.wrapCallback(db, callback);

      let seed = Config.seed;

      if (!seed) {
        return callback(new Error('Could not seed, no seed found in "./config/seed.json". Please make sure JSON is correct.'));
      }

      return ModelFactory.populate(seed, callback);

    });

  }

  wrapCallback(db, callback) {

    return (err) => {
      let cb = callback;
      err && (cb = cb.bind(null, err));
      db.close(cb);
    }

  }

  bootstrap(callback) {

    async.series([
      (cb) => this.drop(cb),
      (cb) => this.create(cb),
      (cb) => this.prepare(cb),
      (cb) => this.migrate(0, cb),
      (cb) => this.seed(cb)
    ], (err) => {

      callback(err || null);

    });

  }

  compose(callback) {

    async.series([
      (cb) => this.prepare(cb),
      (cb) => this.migrate(0, cb),
      (cb) => this.seed(cb)
    ], (err) => {

      callback(err || null);

    });

  }

}

module.exports = new Bootstrapper();
