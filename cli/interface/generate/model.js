module.exports = (function() {
  'use strict';

  let fs = require('fs');
  let Database = require('../../../core/module.js').Database;

  let colors = require('colors/safe');
  let inflect = require('i')();

  let generateMigration = require('./migration.js').generate;

  let dot = require('dot');
  let templateSettings = Object.keys(dot.templateSettings).reduce((o, k) => {
    o[k] = dot.templateSettings[k];
    return o;
  }, {})
  templateSettings.strip = false;
  templateSettings.varname = 'data';

  let modelDir = './app/models';

  function generateModelDefinition(modelName, columns) {

    let model = {
      name: modelName,
      columns: columns
    };

    return dot.template(
      fs.readFileSync(__dirname + '/templates/model.jst').toString(),
      templateSettings
    )(model);

  }

  function generateUserDefinition() {
    return dot.template(
      fs.readFileSync(__dirname + '/templates/models/user.jst').toString(),
      templateSettings
    )();
  };

  function generateAccessTokenDefinition() {
    return dot.template(
      fs.readFileSync(__dirname + '/templates/models/access_token.jst').toString(),
      templateSettings
    )();
  };

  function convertArgListToPropertyList(argList) {

    // Instantiate Database so we can get access to the Adapater types
    let db = new Database();

    return argList.slice(1).map(function(v) {

      if (Object.keys(db.adapter.types).indexOf(v[1].toLowerCase()) == -1) {
        throw new Error(`Un-supported column type ${colors.yellow.bold(v[1])} for field ${colors.yellow.bold(v[0])}`);
      }

      let obj = {name: inflect.underscore(v[0]), type: v[1].toLowerCase()};
      let rest = v.slice(2);
      let properties = {};

      ['array', 'unique'].forEach(v => {
        if (rest.indexOf(v) !== -1) {
          properties[v] = true;
        }
      });

      Object.keys(properties).length && (obj.properties = properties);

      return obj;

    });

  }

  function generateModelSchemaObject(modelName, propertyList) {

    return {
      table: inflect.tableize(modelName),
      columns: propertyList
    };

  }

  return {
    command: function(args, flags) {

      if (flags.hasOwnProperty('user')) {
        args = [
          ['User'],
          ['email', 'string', 'unique'],
          ['password', 'string'],
          ['username', 'string'],
        ];
      } else if (flags.hasOwnProperty('access_token')) {
        args = [
          ['AccessToken'],
          ['user_id', 'int'],
          ['access_token', 'string'],
          ['token_type', 'string'],
          ['expires_at', 'datetime'],
          ['ip_address', 'string']
        ];
      }

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No model name specified.');
        return;
      }

      let modelName = inflect.classify(args[0][0]);

      let schemaObject = generateModelSchemaObject(modelName, convertArgListToPropertyList(args));

      !fs.existsSync(modelDir) && fs.mkdirSync(modelDir);

      let createPath = modelDir + '/' + inflect.underscore(modelName) + '.js';

      if (fs.existsSync(createPath)) {
        throw new Error('Model already exists');
      }

      if (flags.hasOwnProperty('user')) {

        fs.writeFileSync(createPath, generateUserDefinition());

      } else if (flags.hasOwnProperty('access_token')) {

        fs.writeFileSync(createPath, generateAccessTokenDefinition());

      } else {

        fs.writeFileSync(createPath, generateModelDefinition(modelName));
      }

      console.log(colors.green.bold('Create: ') + createPath);

      generateMigration('Create' + modelName,
        ['this.createTable(\"' + schemaObject.table + '\", ' + JSON.stringify(schemaObject.columns) + ')'],
        ['this.dropTable(\"' + schemaObject.table + '\")']
      );

      if (flags.hasOwnProperty('user')) {

        console.log('Installing additional packages in this directory...');
        console.log('');

        let spawn = require('cross-spawn-async');
        let child = spawn('npm',  ['install', 'bcrypt', '--save'], {cwd: process.cwd(), stdio: 'inherit'});

        child.on('exit', function() {

          child && child.kill();
          process.exit(0);

        });

        return;

      }

      process.exit(0);

    }
  };

})();
