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

    generateSimpleForeignKeyQuery(table, referenceTable) {}
    generateDropSimpleForeignKeyQuery(table, referenceTable) {}

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

    generateDropTableQuery(table, ifExists) {

      return `DROP TABLE ${ifExists?'IF EXISTS ':''}${this.escapeField(table)}`;

    }

    generateTruncateTableQuery(table) {

      return `TRUNCATE TABLE ${this.escapeField(table)} RESTART IDENTITY`;

    }

    generateSelectQuery(subQuery, table, columns, multiFilter, joinArray, orderObjArray, limitObj, paramOffset) {

      let formatTableField = (table, column) => `${this.escapeField(table)}.${this.escapeField(column)}`;

      if (typeof subQuery === 'object' && subQuery !== null) {
        subQuery = this.escapeField(subQuery.table);
      } else {
        subQuery = subQuery ? `(${subQuery})` : table;
      }

      return [
        'SELECT ',
          columns.map(field => {
            if (typeof field === 'string') {
              return `(${formatTableField(table, field)}) AS ${this.escapeField(field)}`;
            }
            return `(${formatTableField(field.name || field.table || table, field.columnName)}) AS ${this.escapeField(field.alias)}`;
          }).join(','),
        ' FROM ',
          subQuery,
          ' AS ',
          this.escapeField(table),
          this.generateJoinClause(table, joinArray),
          this.generateWhereClause(table, multiFilter, paramOffset),
          this.generateGroupByClause(table, []),
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
        ` SET (${columnNames.map(this.escapeField.bind(this)).join(',')}) = (${columnNames.map((v, i) => '$' + (i + offset + 1)).join(',')})`,
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

    parseWhereObj(table, whereObj) {

      return whereObj.map((where, i) => {
        return {
          table: where.table,
          columnName: where.columnName,
          refName: [this.escapeField(where.table || table), this.escapeField(where.columnName)].join('.'),
          comparator: where.comparator,
          value: where.value,
          ignoreValue: !!this.comparatorIgnoresValue[where.comparator],
          joined: where.joined,
          via: where.via,
          child: where.child
        };
      });

    }

    createMultiFilter(table, whereObjArray) {

      return whereObjArray
        .filter(v => v)
        .sort((a, b) => a.joined === b.joined ? a.table > b.table : a.joined > b.joined) // important! must be sorted.
        .map(v => this.parseWhereObj(table, v));

    }

    generateWhereClause(table, multiFilter, paramOffset) {

      paramOffset = Math.max(0, parseInt(paramOffset) || 0);

      if (!multiFilter || !multiFilter.length) {
        return '';
      }

      return (' WHERE (' + multiFilter.map(whereObj => {
        return this.generateAndClause(table, whereObj);
      }).join(') OR (') + ')').replace(/__VAR__/g, () => `\$${1 + (paramOffset++)}`);

    }

    generateAndClause(table, whereObjArray) {

      let comparators = this.comparators;

      if (!whereObjArray.length) {
        return '';
      }

      let lastTable = null;
      let clauses = [];
      let joinedClauses = [];

      for (let i = 0; i < whereObjArray.length; i++) {

        let whereObj = whereObjArray[i];
        let joined = whereObj.joined;
        let table = whereObj.table;

        if (!joined) {

          clauses.push(comparators[whereObj.comparator](whereObj.refName));

        } else {

          let currentJoinedClauses = [];

          if (lastTable === table) {

            currentJoinedClauses = joinedClauses[joinedClauses.length - 1].clauses;

          } else {

            joinedClauses.push({
              table: table,
              via: whereObj.via,
              child: whereObj.child,
              clauses: currentJoinedClauses
            });

          }

          currentJoinedClauses.push(comparators[whereObj.comparator](whereObj.refName));

        }

      }

      joinedClauses = joinedClauses.map(jc => {

        jc.clauses.push(
          jc.child ?
          `${this.escapeField(jc.table)}.${this.escapeField(jc.via)} = ${this.escapeField(table)}.${this.escapeField('id')}` :
          `${this.escapeField(table)}.${this.escapeField(jc.via)} = ${this.escapeField(jc.table)}.${this.escapeField('id')}`
        );

        return [
          `(`,
            `SELECT ${this.escapeField(jc.table)}.${this.escapeField('id')} `,
            `FROM ${this.escapeField(jc.table)} `,
            `WHERE (${jc.clauses.join(' AND ')}) `,
            `LIMIT 1`,
          `) IS NOT NULL`
        ].join('');

      });

      return clauses.concat(joinedClauses).join(' AND ');

    }

    getParamsFromMultiFilter(multiFilter) {
      return [].concat.apply([], multiFilter)
        .filter(whereObj => !whereObj.ignoreValue)
        .map(whereObj => whereObj.value);
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

          let fields = join.field instanceof Array ? join.field : [join.field]
          let baseFields = join.baseField instanceof Array ? join.baseField : [join.baseField]

          let statements = [];

          fields.forEach(field => {
            baseFields.forEach(baseField => {
              statements.push(
                `${this.escapeField(join.name || join.table)}.${this.escapeField(field)} = ` +
                `${this.escapeField(table)}.${this.escapeField(baseField)}`
              );
            });
          });

          return [
            ` LEFT JOIN ${this.escapeField(join.table)}`,
            `AS ${this.escapeField(join.name || join.table)}`,
            `ON (${statements.join(' OR ')})`
          ].join(' ');

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
    startswith: field => `${field} LIKE __VAR__ || '%'`,
    istartswith: field => `${field} ILIKE __VAR__ || '%'`,
    endswith: field => `${field} LIKE '%' || __VAR__`,
    iendswith: field => `${field} ILIKE '%' || __VAR__`,
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

  DatabaseAdapter.prototype.supportsForeignKey = false;

  return DatabaseAdapter;

})();
