'use strict';

const inflect = require('i')();
const SQLAdapter = require('../sql_adapter.js');
const utilities = require('../../utilities.js');

const async = require('async');

const pg = require('pg');
pg.defaults.poolSize = 8;

class PostgresAdapter extends SQLAdapter {

  constructor(db, cfg) {

    super();

    cfg = cfg.connectionString ? this.parseConnectionString(cfg.connectionString) : cfg;

    this.db = db;
    this._config = cfg;

  }

  close() {

    pg.end();

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
    let log = this.db.log.bind(this.db);

    pg.connect(this._config, (err, client, complete) => {

      if (err) {
        this.db.error(err.message);
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
        this.db.error(err.message);
        callback(err);
        return complete();
      }

      let queries = preparedArray.map(queryData => {

        let query = queryData[0];
        let params = queryData[1] || [];

        return (callback) => {
          this.db.log(query, params, new Date().valueOf() - start);
          client.query(queryData[0], queryData[1], callback);
        };

      });

      queries = [].concat(
        (callback) => {
          client.query('BEGIN', callback);
        },
        queries
      );

      this.db.info('Transaction started...');

      async.series(queries, (txnErr, results) => {

        if (txnErr) {

          this.db.error(txnErr.message);
          this.db.info('Rollback started...');

          client.query('ROLLBACK', (err) => {

            if (err) {
              this.db.error(`Rollback failed - ${err.message}`);
              this.db.info('Transaction complete!');
              complete();
              callback(err);
            } else {
              this.db.info('Rollback complete!')
              this.db.info('Transaction complete!');
              complete();
              callback(txnErr);
            };

          });

        } else {

          this.db.info('Commit started...');

          client.query('COMMIT', (err) => {

            if (err) {
              this.db.error(`Commit failed - ${err.message}`);
              this.db.info('Transaction complete!');
              complete();
              callback(err);
              return;
            }

            this.db.info('Commit complete!')
            this.db.info('Transaction complete!');
            complete();
            callback(null, results);

          });

        }

      });

    });

  }

  /* Command functions... */

  drop(databaseName, callback) {

    this.query(this.generateDropDatabaseQuery(databaseName), [], (err, result) => {

      if (err) {
        return callback(err);
      }

      this.db.info(`Dropped database "${databaseName}"`);
      callback(null);

    });

  }

  create(databaseName, callback) {

    this.query(this.generateCreateDatabaseQuery(databaseName), [], (err, result) => {

      if (err) {
        return callback(err);
      }

      this.db.info(`Created empty database "${databaseName}"`);
      callback(null);

    });

  }

  /* generate functions */

  generateArray(arr) {

    return '{' + arr.join(',') + '}';

  }

  generateConnectionString(host, port, database, user, password) {

    if (!host || !port || !database) {
      return '';
    }

    return 'postgres://' + user + ':' + password + '@' + host + ':' + port + '/' + database;

  }

  parseConnectionString(str) {

    let cfg = {
      host: '',
      database: '',
      user: '',
      password: '',
      port: 5432,
      ssl: false
    };

    let match = str.match(/^postgres:\/\/([A-Za-z0-9_]+)(?:\:([A-Za-z0-9_\-]+))?@([A-Za-z0-9_\.\-]+):(\d+)\/([A-Za-z0-9_]+)$/);

    if (match) {
      cfg.user = match[1];
      cfg.password = match[2];
      cfg.host = match[3];
      cfg.port = match[4];
      cfg.database = match[5];
    }

    return cfg;

  }

  generateClearDatabaseQuery() {

    return [
      'DROP SCHEMA public CASCADE',
      'CREATE SCHEMA public'
    ].join(';')

  }

  generateCreateDatabaseQuery(name) {

    return [
      'CREATE DATABASE',
      this.escapeField(name)
    ].join(' ');

  }

  generateDropDatabaseQuery(name) {

    return [
      'DROP DATABASE IF EXISTS',
      this.escapeField(name)
    ].join(' ');

  }

  generateColumn(columnName, columnType, columnProperties) {

    return [
      this.escapeField(columnName),
      columnType,
      columnProperties.array ? 'ARRAY' : '',
      (columnProperties.primary_key || !columnProperties.nullable) ? 'NOT NULL' : ''
    ].filter(function(v) { return !!v; }).join(' ');

  }

  generateAlterColumn(columnName, columnType, columnProperties) {

    return [
      'ALTER COLUMN',
      this.escapeField(columnName),
      'TYPE',
      columnType,
      columnProperties.array ? 'ARRAY' : '',
    ].filter(function(v) { return !!v; }).join(' ');

  }

  generateAlterColumnSetNull(columnName, columnType, columnProperties) {

    return [
      'ALTER COLUMN',
      this.escapeField(columnName),
      (columnProperties.primary_key || !columnProperties.nullable) ? 'SET' : 'DROP',
      'NOT NULL'
    ].join(' ');

  }

  generateAlterColumnDropDefault(columnName, columnType, columnProperties) {

    return [
      'ALTER COLUMN',
      this.escapeField(columnName),
      'DROP DEFAULT'
    ].join(' ');

  }

  generateAlterColumnSetDefaultSeq(columnName, seqName) {
    return [
      'ALTER COLUMN ',
        this.escapeField(columnName),
      ' SET DEFAULT nextval(\'',
        seqName,
      '\')'
    ].join('');
  }

  generateIndex(table, columnName) {

    return this.generateConstraint(table, columnName, 'index');

  }

  generateConstraint(table, columnName, suffix) {
    return this.escapeField([table, columnName, suffix].join('_'));
  }

  generatePrimaryKey(table, columnName) {

    return ['CONSTRAINT ', this.generateConstraint(table, columnName, 'pk'), ' PRIMARY KEY(', this.escapeField(columnName), ')'].join('');

  }

  generateUniqueKey(table, columnName) {

    return ['CONSTRAINT ', this.generateConstraint(table, columnName, 'unique'), ' UNIQUE(', this.escapeField(columnName), ')'].join('');

  }

  generateAlterTableRename(table, newTableName, columns) {

    let self = this;

    return [
      [
        'ALTER TABLE',
          this.escapeField(table),
        'RENAME TO',
          this.escapeField(newTableName)
      ].join(' '),
    ].concat(
      this.getPrimaryKeys(columns).map(function(columnData) {
        return [
          'ALTER TABLE',
            self.escapeField(newTableName),
          'RENAME CONSTRAINT',
            self.generateConstraint(table, columnData.name, 'pk'),
          'TO',
            self.generateConstraint(newTableName, columnData.name, 'pk')
        ].join(' ');
      }),
      this.getUniqueKeys(columns).map(function(columnData) {
        return [
          'ALTER TABLE',
            self.escapeField(newTableName),
          'RENAME CONSTRAINT',
            self.generateConstraint(table, columnData.name, 'unique'),
          'TO',
            self.generateConstraint(newTableName, columnData.name, 'unique')
        ].join(' ');
      }),
      this.getAutoIncrementKeys(columns).map(function(columnData) {
        return self.generateRenameSequenceQuery(table, columnData.name, newTableName, columnData.name);
      })
    ).join(';');
  }

  generateAlterTableColumnType(table, columnName, columnType, columnProperties) {

    let queries = [
      [
        'ALTER TABLE',
          this.escapeField(table),
          this.generateAlterColumn(columnName, columnType, columnProperties)
      ].join(' '),
      [
        'ALTER TABLE',
          this.escapeField(table),
          this.generateAlterColumnSetNull(columnName, columnType, columnProperties)
      ].join(' '),
      [
        'ALTER TABLE',
          this.escapeField(table),
          this.generateAlterColumnDropDefault(columnName)
      ].join(' '),
      this.generateDropSequenceQuery(table, columnName)
    ]

    if (columnProperties.auto_increment) {
      queries.push(this.generateCreateSequenceQuery(table, columnName));
      queries.push([
        'ALTER TABLE',
          this.escapeField(table),
          this.generateAlterColumnSetDefaultSeq(columnName, this.generateSequence(table, columnName))
      ].join(' '));
    }

    return queries.join(';');

  }

  generateAlterTableAddPrimaryKey(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generatePrimaryKey(table, columnName)
    ].join(' ');

  }

  generateAlterTableDropPrimaryKey(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, columnName, 'pk')
    ].join(' ');

  }

  generateAlterTableAddUniqueKey(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD',
        this.generateUniqueKey(table, columnName)
    ].join(' ');

  }

  generateAlterTableDropUniqueKey(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        this.generateConstraint(table, columnName, 'unique')
    ].join(' ');

  }

  generateAlterTableAddColumn(table, columnName, columnType, columnProperties) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD COLUMN',
        this.generateColumn(columnName, columnType, columnProperties)
    ].join(' ');

  }

  generateAlterTableDropColumn(table, columnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP COLUMN IF EXISTS',
        this.escapeField(columnName)
    ].join(' ');

  }

  generateAlterTableRenameColumn(table, columnName, newColumnName) {

    return [
      'ALTER TABLE',
        this.escapeField(table),
      'RENAME COLUMN',
        this.escapeField(columnName),
      'TO',
      this.escapeField(newColumnName)
    ].join(' ');

  }

  generateCreateIndex(table, columnName, indexType) {

    indexType = this.indexTypes.indexOf(indexType) > -1 ? indexType : this.indexTypes[0];
    let indexName = columnName;
    let usingValue = this.escapeField(columnName);

    if (columnName.indexOf(this.columnDepthDelimiter) != -1) {
      // turn ex: recipie->name into recipe_name
      indexName = columnName.replace(new RegExp(this.columnDepthDelimiter, 'i'), '_');
      usingValue = `(${columnName})`;
    }
    return [
      'CREATE INDEX',
        this.generateIndex(table, indexName),
      'ON',
        this.escapeField(table),
      'USING',
        indexType,
      ['(', usingValue, ')'].join('')
    ].join(' ');

  }

  generateDropIndex(table, columnName) {

    return [
      'DROP INDEX', this.generateIndex(table, columnName)
    ].join(' ');

  }

  generateSequence(table, columnName) {
    return this.generateConstraint(table, columnName, 'seq');
  }

  generateCreateSequenceQuery(table, columnName) {

    return [
      [
        'CREATE SEQUENCE',
          this.generateSequence(table, columnName),
        'START 1',
        'OWNED BY',
          [this.escapeField(table), this.escapeField(columnName)].join('.')
      ].join(' '),
      [
        'SELECT setval(\'',
          this.generateSequence(table, columnName),
        '\', GREATEST(COALESCE(MAX(',
          this.escapeField(columnName),
        '), 0), 0) + 1, false) FROM ',
          this.escapeField(table)
      ].join('')
    ].join(';');

  }

  generateSimpleForeignKeyQuery(table, referenceTable) {
    return [
      'ALTER TABLE',
        this.escapeField(table),
      'ADD CONSTRAINT',
        `${this.generateConstraint(table, referenceTable, 'id_fk')}`,
      'FOREIGN KEY',
        `(${this.escapeField(`${inflect.singularize(referenceTable)}_id`)})`,
      'REFERENCES',
        `${this.escapeField(referenceTable)} (${this.escapeField('id')})`
    ].join(' ');

  }

  generateDropSimpleForeignKeyQuery(table, referenceTable) {
    return [
      'ALTER TABLE',
        this.escapeField(table),
      'DROP CONSTRAINT IF EXISTS',
        `${this.generateConstraint(table, referenceTable, 'id_fk')}`,
    ].join(' ');

  }

  generateRenameSequenceQuery(table, columnName, newTable, newColumnName) {

    return [
      'ALTER SEQUENCE',
        this.generateSequence(table, columnName),
      'RENAME TO',
        this.generateSequence(newTable, newColumnName)
    ].join(' ');

  }

  generateDropSequenceQuery(table, columnName) {
    return [
      'DROP SEQUENCE IF EXISTS',
      this.generateSequence(table, columnName)
    ].join(' ');
  }

  generateCreateTableQuery(table, columns) {

    // Create sequences along with table
    let self = this;

    return [
      super.generateCreateTableQuery(table, columns),
      this.getAutoIncrementKeys(columns).map(function(columnData) {
        return [
          self.generateCreateSequenceQuery(table, columnData.name),
          [
            'ALTER TABLE',
              self.escapeField(table),
              self.generateAlterColumnSetDefaultSeq(columnData.name, self.generateSequence(table, columnData.name))
          ].join(' ')
        ].join(';');
      })
    ].join(';');

  }

  generateLimitClause(limitObj) {

    return (!limitObj) ? '' :
      (limitObj.count ? ` LIMIT ${limitObj.count}` : '') +
      (limitObj.offset ? ` OFFSET ${limitObj.offset}` : '');

  }

  preprocessWhereObj(table, whereObj) {

    let whereObjArray = []
    whereObj.forEach( where => {
      if (utilities.isObject(where.value)) {
        Object.keys(where.value).map( (k) => {
          whereObjArray.push(Object.assign({}, where, {
            columnName: `${where.columnName}${this.whereDepthDelimiter}'${k}'`,
            value: where.value[k]
          }));
        });
      } else {
        whereObjArray.push(where);
      }
    });

    return whereObjArray;

  }

}

PostgresAdapter.prototype.sanitizeType = {
  boolean: function(v) {
    return ['f', 't'][v | 0];
  },
  json: function(v) {
    return JSON.stringify(v);
  }
}

PostgresAdapter.prototype.escapeFieldCharacter = '"';
PostgresAdapter.prototype.columnDepthDelimiter = '->';
PostgresAdapter.prototype.whereDepthDelimiter = '->>';

PostgresAdapter.prototype.indexTypes = [
  'btree',
  'hash',
  'gist',
  'gin'
];

PostgresAdapter.prototype.documentTypes = [
  'json'
];

PostgresAdapter.prototype.comparators = {
  is: field => `${field} = __VAR__`,
  not: field => `${field} <> __VAR__`,
  lt: field => `${field} < __VAR__`,
  lte: field => `${field} <= __VAR__`,
  gt: field => `${field} > __VAR__`,
  gte: field => `${field} >= __VAR__`,
  contains: field => `${field} LIKE '%' || __VAR__ || '%'`,
  icontains: field => `${field} ILIKE '%' || __VAR__ || '%'`,
  startswith: field => `${field} LIKE __VAR__ || '%'`,
  istartswith: field => `${field} ILIKE __VAR__ || '%'`,
  endswith: field => `${field} LIKE '%' || __VAR__`,
  iendswith: field => `${field} ILIKE '%' || __VAR__`,
  like: field => `${field} LIKE __VAR__`,
  ilike: field => `${field} ILIKE __VAR__`,
  is_null: field => `${field} IS NULL`,
  not_null: field => `${field} IS NOT NULL`,
  in: field => `ARRAY[${field}] <@ __VAR__`,
  not_in: field => `NOT (ARRAY[${field}] <@ __VAR__)`,
  json: (field, value) => {
    return `${field.replace(/"/g,"")} = __VAR__`;
  },
  jsoncontains: (field) => {
    return `${field.replace(/"/g,"")} ? __VAR__`;
  }
};

PostgresAdapter.prototype.types = {
  serial: {
    dbName: 'BIGINT',
    properties: {
      primary_key: true,
      nullable: false,
      auto_increment: true
    }
  },
  int: {
    dbName: 'BIGINT'
  },
  currency: {
    dbName: 'BIGINT'
  },
  float: {
    dbName: 'FLOAT'
  },
  string: {
    dbName: 'VARCHAR'
  },
  text: {
    dbName: 'TEXT'
  },
  datetime: {
    dbName: 'TIMESTAMP'
  },
  boolean: {
    dbName: 'BOOLEAN'
  },
  json: {
    dbName: 'JSONB'
  }
};

PostgresAdapter.prototype.supportsForeignKey = true;

module.exports = PostgresAdapter;
