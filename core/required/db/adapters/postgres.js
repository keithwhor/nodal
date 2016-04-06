module.exports = (function() {
  'use strict';

  const inflect = require('i')();
  const DatabaseAdapter = require('../adapter.js');
  const utilities = require('../../utilities.js');

  class PostgresAdapter extends DatabaseAdapter {

    generateArray(arr) {

      return '{' + arr.join(',') + '}';

    }

    generateConnectionString(host, port, database, user, password) {

      if (!host || !port || !database) {
        return '';
      }

      return 'postgres://' + user + ':' + password + '@' + host + ':' + port + '/' + database;

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

  return PostgresAdapter;

})();
