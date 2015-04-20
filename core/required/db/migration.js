module.exports = function(db, Schema) {

  var Model = require('../model.js');

  var fs = require('fs');

  var colors = require('colors/safe');
  var inflect = require('i')();

  function Migration() {

    this.id = null;

  };

  Migration.prototype.executeUp = function(callback) {

    var up = this.up().concat([
      'INSERT INTO "schema_migrations"("id") VALUES(' + this.id + ')'
    ]);

    db.transaction(up.join(';'), callback);

  };

  Migration.prototype.executeDown = function(callback) {

    var down = this.down().concat([
      'DELETE FROM "schema_migrations" WHERE id = ' + this.id
    ]);

    db.transaction(down.join(';'), callback);

  };

  Migration.prototype.up = function() {

    return [];

  };

  Migration.prototype.down = function() {

    return [];

  };

  Migration.prototype.createTable = function(table, fields) {

    var model = new Model();

    fields = fields || [];

    var schema = {
      table: table,
      fields: fields
    };

    schema = Schema[inflect.classify(table)] = model.setSchema(schema);

    return db.adapter.generateCreateTableQuery(schema.table, schema.fields);

  };

  Migration.prototype.dropTable = function(table) {

    delete Schema[inflect.classify(table)];

    return db.adapter.generateDropTableQuery(table);

  };

  Migration.prototype.addField = function(table, fieldData) {

    /* fix this bro */

    var model = new Model();

    var schema = Schema[inflect.classify(table)];
    schema.fields.push(fieldData);

    Schema[inflect.classify(table)] = model.setSchema(schema);

    return model.generateCreateFieldSQL(fieldData); // ?

  };

  Migration.prototype.generateSchema = function(id) {

    var fileData = [
      'module.exports = {',
      '',
      '  migration_id: ' + (typeof id === 'undefined' ? this.id : id) + ',',
    ];

    if (Object.keys(Schema).length > 1) {

      fileData = fileData.concat([
        '',
        Object.keys(Schema).filter(function(v) {
          return v !== 'migration_id';
        }).sort().map(function(v) {
          return [
            '  ' + v + ': {',
            '',
            '    table: \'' + Schema[v].table + '\',',
            '',
            '    fields: [',
            Schema[v].fields.map(function(fieldData) {
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

  return Migration;

};
