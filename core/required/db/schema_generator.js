'use strict';

const fs = require('fs');
const inflect = require('i')();

class SchemaGenerator {

  constructor(db) {

    this.db = db;

    this.migrationId = null;
    this.models = {};
    this.indices = [];

    this._defaultPath = 'db/schema.json';

  }

  load(filename) {
    filename = filename || this._defaultPath;
    filename = process.cwd() + '/' + filename;
    return this.read(fs.readFileSync(filename));
  }

  fetch(callback) {

    this.db.query('SELECT "schema_migrations"."schema" FROM "schema_migrations" ORDER BY "id" DESC LIMIT 1', [], (function(err, result) {

      if (err) {
        return callback(err);
      }

      result.rows && result.rows.length && this.read(result.rows[0].schema);

      callback(null);

    }).bind(this));

  }

  save(filename) {
    filename = filename || this._defaultPath;
    filename = process.cwd() + '/' + filename;
    fs.writeFileSync(filename, this.generate());
    return true;
  }

  mergeProperties(columnData, properties) {

    properties = properties || {};

    let defaults = this.db.adapter.typePropertyDefaults;

    let oldProperties = this.db.adapter.getTypeProperties(columnData.type, columnData.properties) || {};
    let newProperties = {};

    this.db.adapter.typeProperties.forEach(function(v) {
      if (properties.hasOwnProperty(v) && properties[v] !== defaults[v]) {
        newProperties[v] = properties[v];
      } else if (oldProperties.hasOwnProperty(v) && oldProperties[v] !== defaults[v]) {
        newProperties[v] = oldProperties[v];
      }
    });

    columnData.properties = newProperties;

    return columnData;

  }

  set(schema) {

    this.setMigrationId(schema.migration_id);
    this.models = schema.models || {};
    this.indices = schema.indices || [];

    return true;

  }

  setMigrationId(id) {
    this.migrationId = id;
  }

  findClass(table) {

    let models = this.models;
    return Object.keys(models).filter(function(v) {
      return models[v].table === table;
    }).pop();

  }

  createTable(table, arrColumnData, modelName) {

    let tableClass = modelName || inflect.classify(table);

    if (this.models[tableClass]) {
      throw new Error('Model with name "' + tableClass + '" already exists in your schema');
    }

    if (this.findClass(table)) {
      throw new Error('Table with name "' + table + '" already exists in your schema.');
    }

    arrColumnData = arrColumnData.slice();

    let columns = arrColumnData.map(function(v) {
      return v.name;
    });

    if (columns.indexOf('id') === -1) {
      arrColumnData.unshift({name: 'id', type: 'serial'});
    }

    if (columns.indexOf('created_at') === -1) {
      arrColumnData.push({name:'created_at', type: 'datetime'});
    }

    if (columns.indexOf('updated_at') === -1) {
      arrColumnData.push({name:'updated_at', type: 'datetime'});
    }

    let defaults = this.db.adapter.typePropertyDefaults;

    arrColumnData.forEach((function(columnData) {
      this.mergeProperties(columnData);
    }).bind(this));

    this.models[tableClass] = {
      table: table,
      columns: arrColumnData
    };

    return arrColumnData;

  }

  dropTable(table) {

    let tableClass = this.findClass(table);

    if (!tableClass) {
      throw new Error('Table "' + table + '" does not exist in your schema');
    }

    delete this.models[tableClass];

    return true;

  }

  renameTable(table, newTableName, renameModel, newModelName) {

    let tableClass = this.findClass(table);

    if (!tableClass) {
      throw new Error('Table "' + table + '" does not exist in your schema');
    }

    this.models[tableClass].table = newTableName;

    if (renameModel) {
      let newClass = newModelName || inflect.classify(newTableName);
      this.models[newClass] = this.models[tableClass];
      delete this.models[tableClass];
      tableClass = newClass;
    }

    return this.models[tableClass];

  }

  alterColumn(table, column, type, properties) {

    if (properties.primary_key) {
      delete properties.unique;
    }

    let models = this.models;
    let modelKey = Object.keys(models).filter(function(t) {
      return models[t].table === table;
    }).pop();

    if (!modelKey) {
      throw new Error('Table "' + table + '" does not exist');
    }

    let schemaFieldData = models[modelKey].columns.filter(function(v) {
      return v.name === column;
    }).pop();

    if (!schemaFieldData) {
      throw new Error('Column "' + column + '" of table "' + table + '" does not exist');
    }

    schemaFieldData.type = type;

    this.mergeProperties(schemaFieldData, properties);

    return true;

  }

  addColumn(table, column, type, properties) {

    if (properties.primary_key) {
      delete properties.unique;
    }

    let models = this.models;
    let modelKey = Object.keys(models).filter(function(t) {
      return models[t].table === table;
    }).pop();

    if (!modelKey) {
      throw new Error('Table "' + table + '" does not exist');
    }

    let modelSchema = models[modelKey];

    let schemaFieldData = modelSchema.columns.filter(function(v) {
      return v.name === column;
    }).pop();

    if (schemaFieldData) {
      throw new Error('Column "' + column + '" of table "' + table + '" already exists');
    }

    let columnData = {
      name: column,
      type: type,
      properties: properties
    };

    modelSchema.columns.push(columnData);

    return true;

  }

  dropColumn(table, column) {

    let models = this.models;
    let modelKey = Object.keys(models).filter(function(t) {
      return models[t].table === table;
    }).pop();

    if (!modelKey) {
      throw new Error('Table "' + table + '" does not exist');
    }

    let modelSchema = models[modelKey];

    let columnIndex = modelSchema.columns.map(function(v, i) { return v.name; }).indexOf(column);

    if (columnIndex === -1) {
      throw new Error('Column "' + column + '" of table "' + table + '" does not exist');
    }

    modelSchema.columns.splice(columnIndex, 1);

    return true;

  }

  renameColumn(table, column, newColumn) {

    let models = this.models;
    let modelKey = Object.keys(models).filter(function(t) {
      return models[t].table === table;
    }).pop();

    if (!modelKey) {
      throw new Error('Table "' + table + '" does not exist');
    }

    let modelSchema = models[modelKey];

    let schemaFieldData = modelSchema.columns.filter(function(v) {
      return v.name === column;
    }).pop();

    if (!schemaFieldData) {
      throw new Error('Column "' + column + '" of table "' + table + '" already exists');
    }

    schemaFieldData.name = newColumn;

    return true;

  }

  createIndex(table, column, type) {

    if (this.indices.filter(function(v) {
      return v.table === table && v.column === column;
    }).length) {
      throw new Error(`Index already exists on column "${column}" of table "${table}"`);
    }

    this.indices.push({table: table, column: column, type: type});

    return true

  }

  dropIndex(table, column) {

    this.indices = this.indices.filter(function(v) {
      return !(v.table === table && v.column === column);
    });

    return true;

  }

  addForeignKey(table, referenceTable) {

    let tableClass = inflect.classify(table);
    let referenceTableClass = inflect.classify(referenceTable);

    if (!this.models[tableClass]) {
      throw new Error(`Model ${tableClass} does not exist.`);
    }

    if (!this.models[referenceTableClass]) {
      throw new Error(`Model ${referenceTableClass} does not exist.`);
    }

    return true;

  }

  dropForeignKey(table, referenceTable) {

    let tableClass = inflect.classify(table);
    let referenceTableClass = inflect.classify(referenceTable);

    if (!this.models[tableClass]) {
      throw new Error(`Model ${tableClass} does not exist.`);
    }

    if (!this.models[referenceTableClass]) {
      throw new Error(`Model ${referenceTableClass} does not exist.`);
    }

    return true;

  }

  read(json) {
    return this.set(JSON.parse(json));
  }

  generate() {

    let models = this.models;
    let indices = this.indices;
    let hasModels = !!Object.keys(models).length;
    let hasIndices = indices.length;

    let fileData = [
      '{',
      '',
      '  "migration_id": ' + this.migrationId + ((hasModels || hasIndices) ? ',' : ''),
    ];

    if (hasIndices) {

      fileData = fileData.concat([
        '',
        '  "indices": [',
          indices.map(function(indexData) {
            return [
              '    {',
                [
                  '"table": "' + indexData.table + '"',
                  '"column": "' + indexData.column + '"',
                  (indexData.type ? '"type": "' + indexData.type+ '"' : '')
                ].filter(function(v) { return !!v; }).join(', '),
              '}',
            ].join('');
          }).join(',\n'),
        '  ]' + (hasModels ? ',' : ''),
      ]);

    }

    if (hasModels) {

      fileData = fileData.concat([
        '',
        '  "models": {',
        '',
        Object.keys(models).sort().map(function(t) {
          let curTable = models[t];
          return [
            '    "' + t + '": {',
            '',
            '      "table": "' + curTable.table + '",',
            '',
            '      "columns": [',
            curTable.columns.map(function(columnData) {
              return [
                '        ',
                '{',
                  [
                    '"name": "' + columnData.name + '"',
                    '"type": "' + columnData.type + '"',
                    columnData.properties ? '"properties": ' + JSON.stringify(columnData.properties) : ''
                  ].filter(function(v) { return !!v; }).join(', '),
                '}'
              ].join('');
            }).join(',\n'),
            '      ]',
            '',
            '    }'
          ].join('\n');
        }).join(',\n\n'),
        '',
        '  }'
      ]);

    }

    return fileData.concat([
      '',
      '}',
      ''
    ]).join('\n');

  }

}

module.exports = SchemaGenerator;
