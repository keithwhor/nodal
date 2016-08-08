'use strict';

const Command = require('cmnd').Command;

const Database = require('../../../core/module.js').Database;

const fs = require('fs');
const inflect = require('i')();
const colors = require('colors/safe');
const dot = require('dot');

let templateSettings = Object.keys(dot.templateSettings).reduce((o, k) => {
  o[k] = dot.templateSettings[k];
  return o;
}, {})
templateSettings.strip = false;
templateSettings.varname = 'data';

let migrationDir = './db/migrations';

function composeMigration(up, down) {

  up =  up || [];
  down = down || [];

  return function(migrationName, id) {

    let migration = {
      up: up,
      down: down,
      name: migrationName,
      id: parseInt(id) || 0
    };

    return dot.template(
      fs.readFileSync(__dirname + '/../../templates/migration.jst').toString(),
      templateSettings
    )(migration);

  };

}

function generateId(date) {

  function padZero(n, l) {

    n = n.toString();
    return Array(1 + Math.max(0, l - n.length)).join('0') + n;

  }

  return parseInt([
    [date.getUTCFullYear(), 4],
    [date.getUTCMonth() + 1, 2],
    [date.getUTCDate(), 2],
    [date.getUTCHours(), 2],
    [date.getUTCMinutes(), 2],
    [date.getUTCSeconds(), 2],
    [(date.getUTCMilliseconds() / 10) | 0, 2]
  ].map(function(v) {
    return padZero.apply(null, v);
  }).join(''));

}

function generateMigration(migrationName, up, down, id) {

  id = id || generateId(new Date());
  let migrationFileName = id + '__' + inflect.underscore(migrationName) + '.js';

  !fs.existsSync(migrationDir) && fs.mkdirSync(migrationDir);

  let migrationPath = migrationDir + '/' + migrationFileName;

  if (fs.existsSync(migrationPath)) {
    throw new Error('Migration already exists');
  }

  fs.writeFileSync(migrationPath, composeMigration(up, down)(migrationName, id));

  console.log(colors.green.bold('Create: ') + migrationPath);

}

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

  return {
    table: inflect.tableize(modelName),
    columns: propertyList
  };

}

class GenerateMigrationCommand extends Command {

  constructor() {

    super('g', 'migration');

  }

  help() {

    return {
      description: 'Generate a new, empty migration. Optionally to add / remove columns.',
      args: ['migration name'],
      vflags: {
        add: '[table] [field_1:type_1] [...] [field_n:type_n]'
      }
    };

  }

  run(params, callback) {

    let migrationName = inflect.camelize(params.args[0]);

    if (!migrationName) {
      throw new Error('Migration name not specified');
    }

    let up = [];
    let down = [];

    if (params.vflags.for) {

      let forArgs = params.vflags.for;
      let schemaObject = generateModelSchemaObject(forArgs[0], convertArgListToPropertyList(forArgs));

      up.push('this.createTable(\"' + schemaObject.table + '\", ' + JSON.stringify(schemaObject.columns) + ')');
      down.push('this.dropTable(\"' + schemaObject.table + '\")');

    }

    if (params.vflags.add) {

      let table = params.vflags.add[0];

      params.vflags.add.slice(1).forEach(field => {
        field = field.split(':');
        up.push(`this.addColumn('${table}', '${field[0]}', '${field[1]}')`);
        down.unshift(`this.dropColumn('${table}', '${field[0]}')`);
      });

    }

    generateMigration(migrationName, up, down);

    callback(null);

  }

}

module.exports = GenerateMigrationCommand;
