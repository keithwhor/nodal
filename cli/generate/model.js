"use strict";

module.exports = (function() {

  let fs = require('fs');
  let Database = require('../../core/module.js').Database;

  let colors = require('colors/safe');
  let inflect = require('i')();

  let generateMigration = require('./migration.js').generate;

  let dot = require('dot');

  dot.templateSettings.strip = false;
  dot.templateSettings.varname = 'data';

  let modelDir = './app/models';

  function generateModelDefinition(modelName, columns) {

    let model = {
      name: modelName,
      columns: columns
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

  function generateAccessTokenDefinition() {
    return dot.template(
      fs.readFileSync(__dirname + '/templates/models/access_token.jst', {
        varname: 'data',
        strip: false
      }).toString()
    )();
  };

  function convertArgListToPropertyList(argList) {

    return argList.slice(1).map(function(v) {

      let obj = {name: inflect.underscore(v[0]), type: v[1]};
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

        let spawn = require('child_process').spawn;
        let child = spawn('npm',  ['install', 'bcrypt', '--save'], {cwd: process.cwd(), stdio: [process.stdin, process.stdout, process.stderr]});

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
