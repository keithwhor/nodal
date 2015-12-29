module.exports = (function() {

  'use strict';

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

      return this.getUniqueKeys(columns)
        .map(columnData => this.generateUniqueKey(table, columnData.name))
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

      return `DROP TABLE ${this.escapeField(table)}`

    }

    generateTruncateTableQuery(table) {

      return `TRUNCATE TABLE ${this.escapeField(table)} RESTART IDENTITY`;

    }

    generateSelectQuery(subQuery, table, columnNames, multiFilter, joinArray, groupByArray, columnAggregateBy, orderObjArray, limitObj, paramOffset) {

      let isAggregateQuery = groupByArray instanceof Array;

      let groupingBy = {};
      groupingBy[table] = {};

      groupByArray && groupByArray
        .forEach(g => {
          let t = g.tables[0] || table;
          groupingBy[t] = groupingBy[t] || {};
          groupingBy[t][g.columns[0]] = true
        });

      let formatTableField = (table, column) => `${this.escapeField(table)}.${this.escapeField(column)}`;

      // Determine if we use the aggregate form or normal form of the field.
      let formatField = (table, column, useAggregate) => {
        if (!isAggregateQuery || groupingBy[table][column] || !useAggregate) {
          return formatTableField(table, column);
        }
        return this.aggregate(columnAggregateBy[table][column])(formatTableField(table, column));
      };

      return [
        'SELECT ',
          columnNames.map(field => {
            if (field.transform) {
              let tables = field.tables;
              let columns = field.columns.map((f, i) => formatField(tables[i] || table, f, field.useAggregate));
              return `(${field.transform.apply(null, columns)}) AS ${this.escapeField(field.alias)}`;
            } else if (field.relationship) {
              return `(${formatField(field.table, field.column, true)}) AS ${this.escapeField(field.alias)}`;
            }
            return `(${formatField(table, field, true)}) AS ${this.escapeField(field)}`
          }).join(','),
        ' FROM ',
          subQuery ? `(${subQuery}) AS ` : '',
          this.escapeField(table),
          this.generateJoinClause(table, joinArray),
          this.generateWhereClause(table, multiFilter, paramOffset),
          this.generateGroupByClause(table, groupByArray),
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

      return this.generateUpdateAllQuery(table, columnNames[0], columnNames.slice(1), 1);

    }

    generateUpdateAllQuery(table, pkColumn, columnNames, offset, subQuery) {

      return [
        `UPDATE ${this.escapeField(table)}`,
        ` SET (${columnNames.map(this.escapeField.bind(this)).join(',')}) = (${columnNames.map((v, i) => '$' + (offset + 1)).join(',')})`,
        ` WHERE (`,
          this.escapeField(pkColumn),
          subQuery ? ` IN (${subQuery})` : ` = $1`,
        `) RETURNING *`
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

    parseFilterObj(table, filterObj) {

      return filterObj.map((filter, i) => {
        return {
          table: filter.table,
          columnName: filter.columnName,
          refName: [this.escapeField(filter.table || table), this.escapeField(filter.columnName)].join('.'),
          comparator: filter.comparator,
          value: filter.value,
          ignoreValue: !!this.comparatorIgnoresValue[filter.comparator]
        };
      });

    }

    createMultiFilter(table, filterObjArray) {

      return filterObjArray
        .filter(v => v)
        .map(v => this.parseFilterObj(table, v));

    }

    generateWhereClause(table, multiFilter, paramOffset) {

      paramOffset = Math.max(0, parseInt(paramOffset) || 0);

      return ((!multiFilter || !multiFilter.length) ? '': ' WHERE (' + multiFilter.map((function(filterObj) {
        return this.generateAndClause(table, filterObj);
      }).bind(this)).join(') OR (') + ')').replace(/__VAR__/g, () => `\$${1 + (paramOffset++)}`);

    }

    generateAndClause(table, filterObjArray) {

      let comparators = this.comparators;

      if (!filterObjArray.length) {
        return '';
      }

      return filterObjArray.map(function(filterObj) {
        return comparators[filterObj.comparator](filterObj.refName);
      }).join(' AND ');

    }

    getParamsFromMultiFilter(multiFilter) {
      return [].concat.apply([], multiFilter)
        .filter(filterObj => !filterObj.ignoreValue)
        .map(filterObj => filterObj.value);
    }

    generateOrderByClause(table, orderObjArray) {

      return (!orderObjArray || !orderObjArray.length) ? '' : ' ORDER BY ' + orderObjArray.map(v => {
        let columnStr = `${this.escapeField(table)}.${this.escapeField(v.columnName)}`;
        return (v.format ? v.format(columnStr) : columnStr)  + ` ${v.direction}`;
      }).join(', ');

    }

    generateJoinClause(table, joinArray) {

      return (!joinArray || !joinArray.length) ? '' :
        joinArray.map(join => {
          return ` LEFT JOIN ${this.escapeField(join.table)} ON ` +
          `${this.escapeField(join.table)}.${this.escapeField(join.field)} = ` +
          `${this.escapeField(table)}.${this.escapeField(join.baseField)}`
        }).join('');

    }

    generateGroupByClause(table, groupByArray) {

      return (!groupByArray || !groupByArray.length) ? '' : ' GROUP BY ' + groupByArray.map(v => {
        if (v.format) {
          return v.format.apply(v, v.columns.map((c, i) => `${this.escapeField(v.tables[i] || table)}.${this.escapeField(c)}`));
        } else {
          return `${this.escapeField(v.tables[0] || table)}.${this.escapeField(v.columns[0])}`;
        }
      }).join(', ');

    }

    generateLimitClause(limitObj) {

      return (!limitObj) ? '' : [
        ' LIMIT ',
        limitObj.offset,
        ', ',
        limitObj.count
      ].join('');

    }

    aggregate(aggregator) {

      return typeof aggregator === 'function' ? aggregator : (
        (this.aggregates.hasOwnProperty(aggregator) ?
          this.aggregates[aggregator] :
          this.aggregates[this.defaultAggregate])
      );

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
    is: field => `${field} = __VAR__`,
    not: field => `${field} <> __VAR__`,
    lt: field => `${field} < __VAR__`,
    lte: field => `${field} <= __VAR__`,
    gt: field => `${field} > __VAR__`,
    gte: field => `${field} >= __VAR__`,
    like: field => `${field} LIKE '%' || __VAR__ || '%'`,
    ilike: field => `${field} ILIKE '%' || __VAR__ || '%'`,
    is_null: field => `${field} IS NULL`,
    not_null: field => `${field} IS NOT NULL`,
    in: field => `ARRAY[${field}] <@ __VAR__`,
    not_in: field => `NOT (ARRAY[${field}] <@ __VAR__)`
  };

  DatabaseAdapter.prototype.comparatorIgnoresValue = {
    is_null: true,
    not_null: true
  };

  DatabaseAdapter.prototype.aggregates = {
    'sum': field => `SUM(${field})`,
    'avg': field => `AVG(${field})`,
    'min': field => `MIN(${field})`,
    'max': field => `MAX(${field})`,
    'count': field => `COUNT(${field})`,
    'distinct': field => `COUNT(DISTINCT(${field}))`,
    'none': field => `NULL`,
    'min_date': field => `MIN(DATE_TRUNC('day', ${field}))`,
    'max_date': field => `MAX(DATE_TRUNC('day', ${field}))`,
    'count_true': field => `COUNT(CASE WHEN ${field} THEN 1 ELSE NULL END)`
  };

  DatabaseAdapter.prototype.defaultAggregate = 'none';

  DatabaseAdapter.prototype.types = {};
  DatabaseAdapter.prototype.sanitizeType = {};
  DatabaseAdapter.prototype.escapeFieldCharacter = '';

  return DatabaseAdapter;

})();
