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

  SchemaGenerator.prototype.mergeProperties = function(fieldData, properties) {

    properties = properties || {};

    var defaults = this.db.adapter.typePropertyDefaults;

    var oldProperties = this.db.adapter.getTypeProperties(fieldData.type, fieldData.properties) || {};
    var newProperties = {};

    this.db.adapter.typeProperties.forEach(function(v) {
      if (properties.hasOwnProperty(v) && properties[v] !== defaults[v]) {
        newProperties[v] = properties[v];
      } else if (oldProperties.hasOwnProperty(v) && oldProperties[v] !== defaults[v]) {
        newProperties[v] = oldProperties[v];
      }
    });

    if (Object.keys(newProperties).length) {
      fieldData.properties = newProperties;
    } else {
      delete fieldData.properties;
    }

    return fieldData;

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

  SchemaGenerator.prototype.createTable = function(table, arrFieldData) {

    var tableClass = inflect.classify(table);

    arrFieldData = arrFieldData.slice();

    var fields = arrFieldData.map(function(v) {
      return v.name;
    });

    if (fields.indexOf('id') === -1) {
      arrFieldData.unshift({name: 'id', type: 'serial'});
    }

    if (fields.indexOf('created_at') === -1) {
      arrFieldData.push({name:'created_at', type: 'datetime'});
    }

    var defaults = this.db.adapter.typePropertyDefaults;

    arrFieldData.forEach((function(fieldData) {
      this.mergeProperties(fieldData);
    }).bind(this));

    this.tables[tableClass] = {
      table: table,
      fields: arrFieldData
    };

    return arrFieldData;

  };

  SchemaGenerator.prototype.dropTable = function(table, fieldData) {

    var tableClass = inflect.classify(table);

    delete this.tables[tableClass];

    return true;

  };

  SchemaGenerator.prototype.alterColumn = function(table, column, properties) {

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

    var schemaFieldData = tables[tableKey].fields.filter(function(v) {
      return v.name === column;
    }).pop();

    if (!schemaFieldData) {
      throw new Error('Column "' + column + '" of table "' + table + '" does not exist');
    }

    schemaFieldData.type = properties.type || schemaFieldData.type;
    delete properties.type;

    this.mergeProperties(schemaFieldData, properties);

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
            '    "fields": [',
            curTable.fields.map(function(fieldData) {
              return [
                '      ',
                '{',
                  [
                    '"name": "' + fieldData.name + '"',
                    '"type": "' + fieldData.type + '"',
                    fieldData.properties ? '"properties": ' + JSON.stringify(fieldData.properties) : ''
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
