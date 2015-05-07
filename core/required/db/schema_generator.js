module.exports = (function() {

  var Adapter = require('./adapter.js');
  var fs = require('fs');
  var inflect = require('i')();

  function SchemaGenerator(db) {

    this.db = db;

    this.migrationId = null;
    this.tables = {};

    this._defaultPath = 'db/schema.json';

  }

  SchemaGenerator.prototype.load = function(filename) {
    filename = filename || this._defaultPath;
    filename = process.cwd() + '/' + filename;
    return this.set(JSON.parse(fs.readFileSync(filename)));
  };

  SchemaGenerator.prototype.save = function(filename) {
    filename = filename || this._defaultPath;
    filename = process.cwd() + '/' + filename;
    fs.writeFileSync(filename, this.generate());
    return true;
  };

  SchemaGenerator.prototype.mergeProperties = function(columnData, properties) {

    properties = properties || {};

    var defaults = this.db.adapter.typePropertyDefaults;

    var oldProperties = this.db.adapter.getTypeProperties(columnData.type, columnData.properties) || {};
    var newProperties = {};

    this.db.adapter.typeProperties.forEach(function(v) {
      if (properties.hasOwnProperty(v) && properties[v] !== defaults[v]) {
        newProperties[v] = properties[v];
      } else if (oldProperties.hasOwnProperty(v) && oldProperties[v] !== defaults[v]) {
        newProperties[v] = oldProperties[v];
      }
    });

    if (Object.keys(newProperties).length) {
      columnData.properties = newProperties;
    } else {
      delete columnData.properties;
    }

    return columnData;

  };

  SchemaGenerator.prototype.set = function(schema) {

    this.setMigrationId(schema.migration_id);

    var tables = {};

    Object.keys(schema).filter(function(k) {
      return k !== 'migration_id';
    }).forEach(function(k) {
      tables[k] = schema[k];
    });

    this.tables = tables;

    return true;

  };

  SchemaGenerator.prototype.setMigrationId = function(id) {
    this.migrationId = id;
  };

  SchemaGenerator.prototype.createTable = function(table, arrColumnData) {

    var tableClass = inflect.classify(table);

    arrColumnData = arrColumnData.slice();

    var columns = arrColumnData.map(function(v) {
      return v.name;
    });

    if (columns.indexOf('id') === -1) {
      arrColumnData.unshift({name: 'id', type: 'serial'});
    }

    if (columns.indexOf('created_at') === -1) {
      arrColumnData.push({name:'created_at', type: 'datetime'});
    }

    var defaults = this.db.adapter.typePropertyDefaults;

    arrColumnData.forEach((function(columnData) {
      this.mergeProperties(columnData);
    }).bind(this));

    this.tables[tableClass] = {
      table: table,
      columns: arrColumnData
    };

    return arrColumnData;

  };

  SchemaGenerator.prototype.dropTable = function(table, columnData) {

    var tableClass = inflect.classify(table);

    delete this.tables[tableClass];

    return true;

  };

  SchemaGenerator.prototype.alterColumn = function(table, column, type, properties) {

    if (properties.primary_key) {
      delete properties.unique;
    }

    var tables = this.tables;
    var tableKey = Object.keys(tables).filter(function(t) {
      return tables[t].table === table;
    }).pop();

    if (!tableKey) {
      throw new Error('Table "' + table + '" does not exist');
    }

    var schemaFieldData = tables[tableKey].columns.filter(function(v) {
      return v.name === column;
    }).pop();

    if (!schemaFieldData) {
      throw new Error('Column "' + column + '" of table "' + table + '" does not exist');
    }

    schemaFieldData.type = type;

    this.mergeProperties(schemaFieldData, properties);

    return true;

  };

  SchemaGenerator.prototype.addColumn = function(table, column, type, properties) {

    if (properties.primary_key) {
      delete properties.unique;
    }

    var tables = this.tables;
    var tableKey = Object.keys(tables).filter(function(t) {
      return tables[t].table === table;
    }).pop();

    if (!tableKey) {
      throw new Error('Table "' + table + '" does not exist');
    }

    var tableSchema = tables[tableKey];

    var schemaFieldData = tableSchema.columns.filter(function(v) {
      return v.name === column;
    }).pop();

    if (schemaFieldData) {
      throw new Error('Column "' + column + '" of table "' + table + '" already exists');
    }

    var columnData = {
      name: column,
      type: type,
      properties: properties
    };

    tableSchema.columns.push(columnData);

    return true;

  };

  SchemaGenerator.prototype.dropColumn = function(table, column) {

    var tables = this.tables;
    var tableKey = Object.keys(tables).filter(function(t) {
      return tables[t].table === table;
    }).pop();

    if (!tableKey) {
      throw new Error('Table "' + table + '" does not exist');
    }

    var tableSchema = tables[tableKey];

    var columnIndex = tableSchema.columns.map(function(v, i) { return v.name; }).indexOf(column);

    if (columnIndex === -1) {
      throw new Error('Column "' + column + '" of table "' + table + '" does not exist');
    }

    tableSchema.columns.splice(columnIndex, 1);

    return true;

  };

  SchemaGenerator.prototype.renameColumn = function(table, column, newColumn) {

    var tables = this.tables;
    var tableKey = Object.keys(tables).filter(function(t) {
      return tables[t].table === table;
    }).pop();

    if (!tableKey) {
      throw new Error('Table "' + table + '" does not exist');
    }

    var tableSchema = tables[tableKey];

    var schemaFieldData = tableSchema.columns.filter(function(v) {
      return v.name === column;
    }).pop();

    if (!schemaFieldData) {
      throw new Error('Column "' + column + '" of table "' + table + '" already exists');
    }

    schemaFieldData.name = newColumn;

    return true;

  };

  SchemaGenerator.prototype.generate = function() {

    var tables = this.tables;
    var hasTables = !!Object.keys(tables).length;

    var fileData = [
      '{',
      '',
      '  "migration_id": ' + this.migrationId + (hasTables ? ',' : ''),
    ];

    if (hasTables) {

      fileData = fileData.concat([
        '',
        Object.keys(tables).sort().map(function(t) {
          var curTable = tables[t];
          return [
            '  "' + t + '": {',
            '',
            '    "table": "' + curTable.table + '",',
            '',
            '    "columns": [',
            curTable.columns.map(function(columnData) {
              return [
                '      ',
                '{',
                  [
                    '"name": "' + columnData.name + '"',
                    '"type": "' + columnData.type + '"',
                    columnData.properties ? '"properties": ' + JSON.stringify(columnData.properties) : ''
                  ].filter(function(v) { return !!v; }).join(', '),
                '}'
              ].join('');
            }).join(',\n'),
            '    ]',
            '',
            '  }'
          ].join('\n');
        }).join(',\n\n')
      ]);

    }

    return fileData.concat([
      '',
      '}',
      ''
    ]).join('\n');

  };

  return SchemaGenerator;

})();
