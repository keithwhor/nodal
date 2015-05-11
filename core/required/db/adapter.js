module.exports = (function() {

  function DatabaseAdapter() {

  }

  DatabaseAdapter.prototype.typeProperties = [
    'length',
    'nullable',
    'unique',
    'primary_key',
    'array',
    'defaultValue'
  ];

  DatabaseAdapter.prototype.typePropertyDefaults = {
    length: null,
    nullable: true,
    unique: false,
    primary_key: false,
    array: false,
    defaultValue: null
  };

  DatabaseAdapter.prototype.types = {};
  DatabaseAdapter.prototype.sanitizeType = {};
  DatabaseAdapter.prototype.escapeFieldCharacter = '';

  DatabaseAdapter.prototype.generateConnectionString = function(host, port, database, user, password) {};

  DatabaseAdapter.prototype.generateIndex = function() {};
  DatabaseAdapter.prototype.generateConstraint = function() {};

  DatabaseAdapter.prototype.generateColumn = function(columnName, type, properties) {};
  DatabaseAdapter.prototype.generatePrimaryKey = function(columnName, type, properties) {};
  DatabaseAdapter.prototype.generateUniqueKey = function(columnName, type, properties) {};

  DatabaseAdapter.prototype.generateAlterTableColumnType = function(table, columnName, columnType, columnProperties) {};
  DatabaseAdapter.prototype.generateAlterTableAddPrimaryKey = function(table, columnName) {};
  DatabaseAdapter.prototype.generateAlterTableDropPrimaryKey = function(table, columnName) {};
  DatabaseAdapter.prototype.generateAlterTableAddUniqueKey = function(table, columnName) {};
  DatabaseAdapter.prototype.generateAlterTableDropUniqueKey = function(table, columnName) {};

  DatabaseAdapter.prototype.generateAlterTableAddColumn = function(table, columnName, columnType, columnProperties) {};
  DatabaseAdapter.prototype.generateAlterTableDropColumn = function(table, columnName) {};
  DatabaseAdapter.prototype.generateAlterTableRenameColumn = function(table, columnName, newColumnName) {};

  DatabaseAdapter.prototype.generateCreateIndex = function(table, columnName, indexType) {};
  DatabaseAdapter.prototype.generateDropIndex = function(table, columnName) {};

  DatabaseAdapter.prototype.sanitize = function(type, value) {

    var fnSanitize = this.sanitizeType[type];
    return fnSanitize ? fnSanitize(value) : value;

  };

  DatabaseAdapter.prototype.escapeField = function(name) {
    return ['', name, ''].join(this.escapeFieldCharacter);
  };

  DatabaseAdapter.prototype.getTypeProperties = function(typeName, optionalValues) {

    var type = this.types[typeName];
    var typeProperties = type ? (type.properties || {}) : {};

    optionalValues = optionalValues || {};

    var outputType = Object.create(this.typePropertyDefaults);
    this.typeProperties.forEach(function(v) {
      if (optionalValues.hasOwnProperty(v)) {
        outputType[v] = optionalValues[v];
      } else if(typeProperties.hasOwnProperty(v)) {
        outputType[v] = typeProperties[v];
      }
    });

    return outputType;

  };

  DatabaseAdapter.prototype.getTypeDbName = function(typeName) {
    type = this.types[typeName];
    return type ? type.dbName : 'INTEGER';
  };

  DatabaseAdapter.prototype.generateColumnsStatement = function(table, columns) {
    var self = this;
    return columns
      .map(function(columnData) {
        return self.generateColumn(columnData.name, self.getTypeDbName(columnData.type), self.getTypeProperties(columnData.type, columnData.properties));
      })
      .join(',');
  };

  DatabaseAdapter.prototype.generatePrimaryKeysStatement = function(table, columns) {
    var self = this;
    return columns
      .filter(function(columnData) { return self.getTypeProperties(columnData.type, columnData.properties).primary_key; })
      .map(function(columnData) { return self.generatePrimaryKey(table, columnData.name); })
      .join(',');
  };

  DatabaseAdapter.prototype.generateUniqueKeysStatement = function(table, columns) {
    var self = this;
    return columns
      .filter(
        function(columnData) {
          var type = self.getTypeProperties(columnData.type, columnData.properties);
          return (!type.primary_key && type.unique);
        }
      )
      .map(function(columnData) { return self.generateUniqueKey(table, columnData.name); })
      .join(',');
  };

  DatabaseAdapter.prototype.generateCreateTableQuery = function(table, columns) {

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

  };

  DatabaseAdapter.prototype.generateDropTableQuery = function(table) {

    return [
      'DROP TABLE ', this.escapeField(table)
    ].join('');

  };

  DatabaseAdapter.prototype.generateSelectQuery = function(table, columnNames, multiFilter, orderObjArray, limitObj) {

    return [
      'SELECT ',
        columnNames.map(this.escapeField.bind(this)).join(','),
      ' FROM ',
        this.escapeField(table),
        this.generateWhereClause(table, multiFilter),
        this.generateOrderByClause(table, orderObjArray),
        this.generateLimitClause(limitObj)
    ].join('');

  };

  DatabaseAdapter.prototype.generateCountQuery = function(table, columnName, multiFilter) {

    return [
      'SELECT COUNT(',
        this.escapeField(columnName),
      ') AS __total__ FROM ',
        this.escapeField(table),
        this.generateWhereClause(table, multiFilter)
    ].join('');

  };

  DatabaseAdapter.prototype.generateUpdateQuery = function(table, columnNames) {

    var pkColumn = columnNames[0];

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

  };

  DatabaseAdapter.prototype.generateDeleteQuery = function(table, columnNames) {

    return [
      'DELETE FROM ',
        this.escapeField(table),
      ' WHERE (',
        columnNames.map(this.escapeField.bind(this)).join(','),
      ') = (',
        columnNames.map(function(v, i) { return '$' + (i + 1); }).join(','),
      ') RETURNING *'
    ].join('');

  };

  DatabaseAdapter.prototype.generateInsertQuery = function(table, columnNames) {
    return [
      'INSERT INTO ',
        this.escapeField(table),
      '(',
        columnNames.map(this.escapeField.bind(this)).join(','),
      ') VALUES(',
        columnNames.map(function(v, i) { return '$' + (i + 1); }).join(','),
      ') RETURNING *'
    ].join('');
  };

  DatabaseAdapter.prototype.generateAlterTableQuery = function(table, columnName, type, properties) {

    var queries = [];

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

  };

  DatabaseAdapter.prototype.generateAlterTableAddColumnQuery = function(table, columnName, type, properties) {

    return this.generateAlterTableAddColumn(
      table,
      columnName,
      this.getTypeDbName(type),
      this.getTypeProperties(type, properties)
    );

  };

  DatabaseAdapter.prototype.generateAlterTableDropColumnQuery = function(table, columnName) {

    return this.generateAlterTableDropColumn(table, columnName);

  };

  DatabaseAdapter.prototype.generateAlterTableRenameColumnQuery = function(table, columnName, newColumnName) {

    return this.generateAlterTableRenameColumn(table, columnName, newColumnName);

  };

  DatabaseAdapter.prototype.generateCreateIndexQuery = function(table, columnName, index) {

    indexType = index || 'btree';

    return this.generateCreateIndex(table, columnName, indexType);

  };

  DatabaseAdapter.prototype.generateDropIndexQuery = function(table, columnName) {

    return this.generateDropIndex(table, columnName);

  };

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

  DatabaseAdapter.prototype.parseFilterObj = function(table, filterObj, offset) {

    offset |= 0;
    var self = this;

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

  };

  DatabaseAdapter.prototype.createMultiFilter = function(table, filterObjArray) {

    var offset = 0;
    var parse = this.parseFilterObj.bind(this);

    return filterObjArray
      .filter(function(v) {
        return v;
      }).map(function(v, i) {
        v = parse(table, v, offset);
        offset += v.length;
        return v;
      });

  };

  DatabaseAdapter.prototype.generateWhereClause = function(table, multiFilter) {

    return (!multiFilter || !multiFilter.length) ? '': ' WHERE (' + multiFilter.map((function(filterObj) {
      return this.generateAndClause(table, filterObj);
    }).bind(this)).join(') OR (') + ')';

  };

  DatabaseAdapter.prototype.generateAndClause = function(table, filterObjArray) {

    var comparators = this.comparators;

    if (!filterObjArray.length) {
      return '';
    }

    return filterObjArray.map(function(filterObj) {
      return comparators[filterObj.comparator](filterObj.refName, filterObj.variable);
    }).join(' AND ');

  };

  DatabaseAdapter.prototype.getParamsFromMultiFilter = function(multiFilter) {
    return [].concat.apply([], multiFilter).map(function(filterObj) {
      return filterObj.value;
    });
  };

  DatabaseAdapter.prototype.generateOrderByClause = function(table, orderObjArray) {

    var tableEsc = this.escapeField(table);

    return (!orderObjArray || !orderObjArray.length) ? '' : ' ORDER BY ' + orderObjArray.map((function(v) {
      return [tableEsc, '.', this.escapeField(v.columnName), ' ', v.direction].join('');
    }).bind(this)).join(', ');

  };

  DatabaseAdapter.prototype.generateLimitClause = function(limitObj) {

    return (!limitObj) ? '' : [
      ' LIMIT',
      limitObj.offset,
      ', ',
      limitObj.count
    ].join('');

  };

  return DatabaseAdapter;

})();
