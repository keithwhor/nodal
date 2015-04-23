module.exports = (function() {

  var Adapter = require('./adapter.js');

  function SchemaGenerator() {

    this.migrationId = null;
    this.tables = {};

    this._defaultPath = 'db/schema.js';

  }

  SchemaGenerator.load = function(filename) {
    filename = filename || this._defaultPath;
    filename = process.cwd() + '/' + filename;
    return this.set(require(filename));
  };

  SchemaGenerator.prototype.save = function(filename) {
    filename = filename || this._defaultPath;
    filename = process.cwd() + '/' + filename;
    fs.writeFileSync(filename, this.generate());
    return true;
  };

  SchemaGenerator.prototype.mergeProperties = function(fieldData, properties) {

    properties = properties || {};

    var defaults = Adapter.prototype.typePropertyDefaults;

    var oldProperties = fieldData.properties || {};
    var newProperties = {};

    Adapter.prototype.typeProperties.forEach(function(v) {
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
      arrFieldData.unshift({name: 'id', type: 'index'});
    }

    if (fields.indexOf('created_at') === -1) {
      arrFieldData.push({name:'created_at', type: 'datetime'});
    }

    var defaults = Adapter.prototype.typePropertyDefaults;

    arrFieldData.forEach((function(fieldData) {
      this.mergeProperties(fieldData);
    }).bind(this));

    this.tables[tableClass] = {
      table: table,
      fields: fieldData
    };

    return true;

  };

  SchemaGenerator.prototype.dropTable = function(table, fieldData) {

    var tableClass = inflect.classify(table);

    delete this.tables[tableClass];

    return true;

  };

  SchemaGenerator.prototype.alterColumn = function(table, column, properties) {

    if (fieldData.primary_key) {
      delete fieldData.unique;
    }

    var tableData = this.tables.filter(function(v) {
      return v.table === table;
    }).pop();

    if (!tableData) {
      throw new Error('Table "' + table + '" does not exist');
    }

    var schemaFieldData = tableData.fields.filter(function(v) {
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

    var fileData = [
      'module.exports = {',
      '',
      '  migration_id: ' + this.migration_id + ',',
    ];

    var tables = this.tables;

    if (Object.keys(tables).length) {

      fileData = fileData.concat([
        '',
        Object.keys(tables).sort().map(function(t) {
          var curTable = tables[t];
          return [
            '  ' + v + ': {',
            '',
            '    table: \'' + curTable.table + '\',',
            '',
            '    fields: [',
            curTable.fields.map(function(fieldData) {
              return [
                '      ',
                '{',
                  [
                    'name: \'' + fieldData.name + '\'',
                    'type: \'' + fieldData.type + '\'',
                    fieldData.properties ? 'properties: ' + JSON.stringify(fieldData.properties) : ''
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
      '};',
      ''
    ]).join('\n');

  };

  return SchemaGenerator;

})();
