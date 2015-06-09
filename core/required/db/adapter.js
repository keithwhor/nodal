"use strict";

module.exports = (function() {

  class DatabaseAdapter {

    generateConnectionString(host, port, database, user, password) {}

    generateClearDatabaseQuery() {}
    generateCreateDatabaseQuery() {}
    generateDropDatabaseQuery() {}

    generateIndex() {}
    generateConstraint() {}

    generateColumn(columnName, type, properties) {}
    generateAlterColumn(columnName, type, properties) {}
    generateAlterColumnSetNull(columnName, type, properties) {}
    generatePrimaryKey(columnName, type, properties) {}
    generateUniqueKey(columnName, type, properties) {}

    generateAlterTableRename(table, newTableName) {}

    generateAlterTableColumnType(table, columnName, columnType, columnProperties) {}
    generateAlterTableAddPrimaryKey(table, columnName) {}
    generateAlterTableDropPrimaryKey(table, columnName) {}
    generateAlterTableAddUniqueKey(table, columnName) {}
    generateAlterTableDropUniqueKey(table, columnName) {}

    generateAlterTableAddColumn(table, columnName, columnType, columnProperties) {}
    generateAlterTableDropColumn(table, columnName) {}
    generateAlterTableRenameColumn(table, columnName, newColumnName) {}

    generateCreateIndex(table, columnName, indexType) {}
    generateDropIndex(table, columnName) {}

    sanitize(type, value) {

      let fnSanitize = this.sanitizeType[type];
      return fnSanitize ? fnSanitize(value) : value;

    }

    escapeField(name) {
      return ['', name, ''].join(this.escapeFieldCharacter);
    }

    getTypeProperties(typeName, optionalValues) {

      let type = this.types[typeName];
      let typeProperties = type ? (type.properties || {}) : {};

      optionalValues = optionalValues || {};

      let outputType = Object.create(this.typePropertyDefaults);
      this.typeProperties.forEach(function(v) {
        if (optionalValues.hasOwnProperty(v)) {
          outputType[v] = optionalValues[v];
        } else if(typeProperties.hasOwnProperty(v)) {
          outputType[v] = typeProperties[v];
        }
      });

      return outputType;

    }

    getTypeDbName(typeName) {
      let type = this.types[typeName];
      return type ? type.dbName : 'INTEGER';
    }

    generateColumnsStatement(table, columns) {
      let self = this;
      return columns
        .map(function(columnData) {
          return self.generateColumn(columnData.name, self.getTypeDbName(columnData.type), self.getTypeProperties(columnData.type, columnData.properties));
        })
        .join(',');
    }

    getAutoIncrementKeys(columns) {

      let self = this;
      return columns.filter(function(columnData) {
        return self.getTypeProperties(columnData.type, columnData.properties).auto_increment;
      });

    };

    getPrimaryKeys(columns) {

      let self = this;
      return columns
        .filter(function(columnData) {
          return self.getTypeProperties(columnData.type, columnData.properties).primary_key;
        });


    }

    getUniqueKeys(columns) {

      let self = this;
      return columns
        .filter(function(columnData) {
          let type = self.getTypeProperties(columnData.type, columnData.properties);
          return (!type.primary_key && type.unique);
        });

    }

    generatePrimaryKeysStatement(table, columns) {
      let self = this;
      return this.getPrimaryKeys(columns)
        .map(function(columnData) {
          return self.generatePrimaryKey(table, columnData.name);
        })
        .join(',');
    }

    generateUniqueKeysStatement(table, columns) {
      let self = this;
      return this.getUniqueKeys(columns)
        .map(function(columnData) {
          self.generateUniqueKey(table, columnData.name);
        })
        .join(',');
    }

    generateCreateTableQuery(table, columns) {

      return [
        'CREATE TABLE ',
          this.escapeField(table),
        '(',
          [
            this.generateColumnsStatement(table, columns),
            this.generatePrimaryKeysStatement(table, columns),
            this.generateUniqueKeysStatement(table, columns)
          ].filter(function(v) { return !!v; }).join(','),
        ')'
      ].join('');

    }

    generateDropTableQuery(table) {

      return [
        'DROP TABLE ', this.escapeField(table)
      ].join('');

    }

    generateSelectQuery(table, columnNames, multiFilter, orderObjArray, limitObj) {

      return [
        'SELECT ',
          columnNames.map(this.escapeField.bind(this)).join(','),
        ' FROM ',
          this.escapeField(table),
          this.generateWhereClause(table, multiFilter),
          this.generateOrderByClause(table, orderObjArray),
          this.generateLimitClause(limitObj)
      ].join('');

    }

    generateCountQuery(table, columnName, multiFilter) {

      return [
        'SELECT COUNT(',
          this.escapeField(columnName),
        ') AS __total__ FROM ',
          this.escapeField(table),
          this.generateWhereClause(table, multiFilter)
      ].join('');

    }

    generateUpdateQuery(table, columnNames) {

      let pkColumn = columnNames[0];

      return [
        'UPDATE ',
          this.escapeField(table),
        ' SET (',
          columnNames.slice(1).map(this.escapeField.bind(this)).join(','),
        ') = (',
          columnNames.slice(1).map(function(v, i) { return '$' + (i + 2); }).join(','),
        ') WHERE ',
          this.escapeField(pkColumn), ' = $1',
        ' RETURNING *'
      ].join('');

    }

    generateDeleteQuery(table, columnNames) {

      return [
        'DELETE FROM ',
          this.escapeField(table),
        ' WHERE (',
          columnNames.map(this.escapeField.bind(this)).join(','),
        ') = (',
          columnNames.map(function(v, i) { return '$' + (i + 1); }).join(','),
        ') RETURNING *'
      ].join('');

    }

    generateInsertQuery(table, columnNames) {
      return [
        'INSERT INTO ',
          this.escapeField(table),
        '(',
          columnNames.map(this.escapeField.bind(this)).join(','),
        ') VALUES(',
          columnNames.map(function(v, i) { return '$' + (i + 1); }).join(','),
        ') RETURNING *'
      ].join('');
    }

    generateAlterTableQuery(table, columnName, type, properties) {

      let queries = [];

      if (type) {
        queries.push(
          this.generateAlterTableColumnType(
            table,
            columnName,
            this.getTypeDbName(type),
            this.getTypeProperties(type, properties)
          )
        );
      }

      if (properties.hasOwnProperty('primary_key')) {
        queries.push(
          [
            this.generateAlterTableDropPrimaryKey,
            this.generateAlterTableAddPrimaryKey
          ][properties.primary_key | 0].call(this, table, columnName)
        );
      } else if (properties.hasOwnProperty('unique')) {
        queries.push(
          [
            this.generateAlterTableDropUniqueKey,
            this.generateAlterTableAddUniqueKey
          ][properties.primary_key | 0].call(this, table, columnName)
        );
      }

      return queries.join(';');

    }

    generateAlterTableAddColumnQuery(table, columnName, type, properties) {

      return this.generateAlterTableAddColumn(
        table,
        columnName,
        this.getTypeDbName(type),
        this.getTypeProperties(type, properties)
      );

    }

    generateAlterTableDropColumnQuery(table, columnName) {

      return this.generateAlterTableDropColumn(table, columnName);

    }

    generateAlterTableRenameColumnQuery(table, columnName, newColumnName) {

      return this.generateAlterTableRenameColumn(table, columnName, newColumnName);

    }

    generateCreateIndexQuery(table, columnName, indexType) {

      indexType = indexType || 'btree';

      return this.generateCreateIndex(table, columnName, indexType);

    }

    generateDropIndexQuery(table, columnName) {

      return this.generateDropIndex(table, columnName);

    }

    parseFilterObj(table, filterObj, offset) {

      offset |= 0;
      let self = this;

      return filterObj.map(function(filter, i) {
        return {
          columnName: filter.columnName,
          refName: [self.escapeField(table), self.escapeField(filter.columnName)].join('.'),
          comparator: filter.comparator,
          variable: '$' + (i + offset + 1),
          value: filter.value,
          or: false
        };
      });

    }

    createMultiFilter(table, filterObjArray) {

      let offset = 0;
      let parse = this.parseFilterObj.bind(this);

      return filterObjArray
        .filter(function(v) {
          return v;
        }).map(function(v, i) {
          v = parse(table, v, offset);
          offset += v.length;
          return v;
        });

    }

    generateWhereClause(table, multiFilter) {

      return (!multiFilter || !multiFilter.length) ? '': ' WHERE (' + multiFilter.map((function(filterObj) {
        return this.generateAndClause(table, filterObj);
      }).bind(this)).join(') OR (') + ')';

    }

    generateAndClause(table, filterObjArray) {

      let comparators = this.comparators;

      if (!filterObjArray.length) {
        return '';
      }

      return filterObjArray.map(function(filterObj) {
        return comparators[filterObj.comparator](filterObj.refName, filterObj.variable);
      }).join(' AND ');

    }

    getParamsFromMultiFilter(multiFilter) {
      return [].concat.apply([], multiFilter).map(function(filterObj) {
        return filterObj.value;
      });
    }

    generateOrderByClause(table, orderObjArray) {

      let tableEsc = this.escapeField(table);

      return (!orderObjArray || !orderObjArray.length) ? '' : ' ORDER BY ' + orderObjArray.map((function(v) {
        return [tableEsc, '.', this.escapeField(v.columnName), ' ', v.direction].join('');
      }).bind(this)).join(', ');

    }

    generateLimitClause(limitObj) {

      return (!limitObj) ? '' : [
        ' LIMIT',
        limitObj.offset,
        ', ',
        limitObj.count
      ].join('');

    }

  }

  DatabaseAdapter.prototype.typeProperties = [
    'length',
    'nullable',
    'unique',
    'primary_key',
    'auto_increment',
    'array',
    'defaultValue'
  ];

  DatabaseAdapter.prototype.typePropertyDefaults = {
    length: null,
    nullable: true,
    unique: false,
    primary_key: false,
    auto_increment: false,
    array: false,
    defaultValue: null
  };

  DatabaseAdapter.prototype.indexTypes = [];

  DatabaseAdapter.prototype.comparators = {
    is: function(field, value) {
      return [field, ' = ', value].join('');
    },
    not: function(field, value) {
      return [field, ' <> ', value].join('');
    },
    lt: function(field, value) {
      return [field, ' < ', value].join('');
    },
    lte: function(field, value) {
      return [field, ' <= ', value].join('');
    },
    gt: function(field, value) {
      return [field, ' > ', value].join('');
    },
    gte: function(field, value) {
      return [field, ' >= ', value].join('');
    },
    like: function(field, value) {
      return [field, ' LIKE \'%\' || ', value, ' || \'%\''].join('');
    },
    ilike: function(field, value) {
      return [field, ' ILIKE \'%\' || ', value, ' || \'%\''].join('');
    }
  };

  DatabaseAdapter.prototype.types = {};
  DatabaseAdapter.prototype.sanitizeType = {};
  DatabaseAdapter.prototype.escapeFieldCharacter = '';

  return DatabaseAdapter;

})();
