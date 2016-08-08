'use strict';

const Command = require('cmnd').Command;
const GenerateMigrationCommand = require('./migration.js');
const generateMigration = new GenerateMigrationCommand();

const fs = require('fs');
const Database = require('../../../core/module.js').Database;

const colors = require('colors/safe');
const inflect = require('i')();

const dot = require('dot');
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
    fs.readFileSync(__dirname + '/../../templates/model.jst').toString(),
    templateSettings
  )(model);

}

function generateUserDefinition() {
  return dot.template(
    fs.readFileSync(__dirname + '/../../templates/models/user.jst').toString(),
    templateSettings
  )();
};

function generateAccessTokenDefinition() {
  return dot.template(
    fs.readFileSync(__dirname + '/../../templates/models/access_token.jst').toString(),
    templateSettings
  )();
};

function convertArgListToPropertyList(argList) {

  // Instantiate Database so we can get access to the Adapater types
  let db = new Database();
  db.connect(require(`${process.cwd()}/config/db.json`)[process.env.NODE_ENV || 'development']);

  return argList.slice(1).map(function(v) {

    v = v.split(':');

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

  let tableName = inflect.tableize(modelName);
  if (propertyList.filter(c => c.name === tableName).length) {
    throw new Error(`Can not create a table with an identical field name. (${tableName}.${tableName})`);
  }

  return {
    table: inflect.tableize(modelName),
    columns: propertyList
  };

}

class GenerateModelCommand extends Command {

  constructor() {

    super('g', 'model');

  }

  help() {

    return {
      description: 'Generate a new model and associated migration',
      args: ['ModelName', 'field_1:type_1', '...', 'field_n:type_n'],
      vflags: {
        user: 'Use a prebuilt User model',
        access_token: 'Use a prebuilt AccessToken model'
      }
    };

  }

  run(params, callback) {

    if (params.vflags.hasOwnProperty('user')) {
      params.args = [
        'User',
        'email:string:unique',
        'password:string',
        'username:string'
      ];
    } else if (params.vflags.hasOwnProperty('access_token')) {
      params.args = [
        'AccessToken',
        'user_id:int',
        'access_token:string',
        'token_type:string',
        'expires_at:datetime',
        'ip_address:string'
      ];
    }

    if (!params.args.length) {
      return callback(new Error('No model name specified.'));
    }

    let modelName = inflect.classify(params.args[0]);
    let schemaObject;

    try {
      schemaObject = generateModelSchemaObject(modelName, convertArgListToPropertyList(params.args));
    } catch(e) {
      return callback(e);
    }

    !fs.existsSync(modelDir) && fs.mkdirSync(modelDir);

    let createPath = modelDir + '/' + inflect.underscore(modelName) + '.js';

    if (fs.existsSync(createPath)) {
      return callback(new Error('Model already exists'));
    }

    if (params.vflags.hasOwnProperty('user')) {

      fs.writeFileSync(createPath, generateUserDefinition());

    } else if (params.vflags.hasOwnProperty('access_token')) {

      fs.writeFileSync(createPath, generateAccessTokenDefinition());

    } else {

      fs.writeFileSync(createPath, generateModelDefinition(modelName));
    }

    console.log(colors.green.bold('Create: ') + createPath);

    generateMigration.run({
      args: [`create_${schemaObject.table}`],
      flags: [],
      vflags: {for: params.args}
    }, (err, result) => {

      if (err) {
        return callback(err);
      }

      if (params.vflags.hasOwnProperty('user')) {

        console.log('Installing additional packages in this directory...');
        console.log('');

        let spawn = require('cross-spawn-async');
        let child = spawn('npm',  ['install', 'bcryptjs', '--save'], {cwd: process.cwd(), stdio: 'inherit'});

        child.on('exit', function() {

          child && child.kill();
          callback(null);

        });

        return;

      }

      callback(null);

    });

  }

}

module.exports = GenerateModelCommand;
