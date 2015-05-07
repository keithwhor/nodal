module.exports = (function() {

  var fs = require('fs');
  var Database = require('../../core/module.js').Database;

  var colors = require('colors/safe');
  var inflect = require('i')();

  var generateMigration = require('./migration.js').generate;

  var dot = require('dot');

  dot.templateSettings.strip = false;

  var modelDir = './app/models';

  function generateModelDefinition(modelName) {

    var model = {
      name: modelName
    };

    return dot.template(
      fs.readFileSync(__dirname + '/templates/model.jst', {
        varname: 'data',
        strip: false
      }).toString()
    )(model);

  }

  function generateUserDefinition() {
    return dot.template(
      fs.readFileSync(__dirname + '/templates/models/user.jst', {
        varname: 'data',
        strip: false
      }).toString()
    )();
  };

  function convertArgListToPropertyList(argList) {
    return argList.slice(1).map(function(v) {
      var obj = {name: inflect.underscore(v[0]), type: v[1]};
      if (v[2] && (v[2] === 'array')) {
        obj.properties = {array: true};
      }
      return obj;
    });
  }

  function generateModelSchemaObject(modelName, propertyList) {

    return {
      table: inflect.tableize(modelName),
      fields: propertyList
    };

  }

  return {
    command: function(args, flags) {

      if (flags.hasOwnProperty('user')) {
        args = [
          ['User'],
          ['email', 'string'],
          ['password', 'string'],
          ['name', 'string'],
          ['permission', 'int'],
          ['ip_address', 'string']
        ];
      }

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No model name specified.');
        return;
      }

      var modelName = inflect.classify(args[0][0]);

      var schemaObject = generateModelSchemaObject(modelName, convertArgListToPropertyList(args));

      !fs.existsSync(modelDir) && fs.mkdirSync(modelDir);

      var createPath = modelDir + '/' + inflect.underscore(modelName) + '.js';

      if (fs.existsSync(createPath)) {
        throw new Error('Model already exists');
      }

      if (flags.hasOwnProperty('user')) {
        fs.writeFileSync(createPath, generateUserDefinition());
      } else {
        fs.writeFileSync(createPath, generateModelDefinition(modelName));
      }

      console.log(colors.green.bold('Create: ') + createPath);

      generateMigration('Create' + modelName,
        ['this.createTable(\"' + schemaObject.table + '\", ' + JSON.stringify(schemaObject.fields) + ')'],
        ['this.dropTable(\"' + schemaObject.table + '\")']
      );

      process.exit(0);

    }
  };

})();
