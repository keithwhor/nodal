'use strict';

const Command = require('cmnd').Command;

const fs = require('fs');

const colors = require('colors/safe');
const inflect = require('i')();

const dot = require('dot');
let templateSettings = Object.keys(dot.templateSettings).reduce((o, k) => {
  o[k] = dot.templateSettings[k];
  return o;
}, {})
templateSettings.strip = false;
templateSettings.varname = 'data';

let controllerDir = './app/controllers';

function generateController(controllerName, forModel) {

  let controller = {
    name: controllerName,
    for: forModel
  };

  var fn = dot.template(
    fs.readFileSync(__dirname + '/../../templates/controller.jst').toString(),
    templateSettings
  );

  return fn(controller);

}

function generateRoute(controllerName, controllerPath, controllerRoute) {

  let importStatement = [
    'const ',
      controllerName,
    ' = ',
    'Nodal.require(\'app/controllers/',
      controllerPath.join('/'),
    '\');'
  ].join('')

  let routeStatement = [
    `router.route('/`,
    controllerPath.slice(0, -1).concat([controllerRoute]).join('/'),
    `/\{id\}').use(`,
    controllerName,
    ');'
  ].join('');

  let routes = fs.readFileSync('./app/router.js').toString();

  routes = routes.split('\n');

  let importIndex = routes.map(function(v, i) {
    return {
      spaces: v.indexOf('/* generator: end imports */'),
      index: i
    }
  }).filter(function(v) {
    return v.spaces > -1;
  }).pop();

  if (importIndex !== undefined) {

    routes = routes.slice(0, importIndex.index - 1).concat(
      [
        Array(importIndex.spaces + 1).join(' ') + importStatement,
      ],
      routes.slice(importIndex.index - 1)
    );

  }

  let routeIndex = routes.map(function(v, i) {
    return {
      spaces: v.indexOf('/* generator: end routes */'),
      index: i
    }
  }).filter(function(v) {
    return v.spaces > -1;
  }).pop();

  if (routeIndex !== undefined) {

    routes = routes.slice(0, routeIndex.index - 1).concat(
      [
        Array(routeIndex.spaces + 1).join(' ') + routeStatement,
      ],
      routes.slice(routeIndex.index - 1)
    );

  }

  fs.writeFileSync('./app/router.js', routes.join('\n'));

  console.log(colors.green.bold('Modify: ') + './app/router.js');

}

class GenerateControllerCommand extends Command {

  constructor() {

    super('g', 'controller');

  }

  help() {

    return {
      description: 'Creates a new controller, and adds a default route',
      args: ['controller name'],
      vflags: {for: 'The model the controller is for'}
    };

  }

  run(params, callback) {

    if (!params.args.length && !params.vflags.for) {
      return callback(new Error('No controller path specified.'));
    }

    let controllerPath = params.args[0] ? params.args[0].split('/') : [];
    let cd = controllerDir;

    let forModel = null;

    if (Object.keys(params.vflags).filter(key => key.substr(0, 4) === 'for:').length) {
      return callback(new Error('Syntax `--for:ModelName` removed. Use `--for ModelName` instead.'));
    }

    if (params.vflags.for) {

      forModel = {
        name: inflect.classify(params.vflags.for[0]),
        path: 'app/models/' + inflect.underscore(inflect.classify(params.vflags.for[0])) + '.js'
      };

      controllerPath.push(inflect.tableize(forModel.name));

    }

    let controllerRoute = inflect.underscore(controllerPath.pop());

    let controllerName = inflect.classify(controllerRoute + '_controller');

    controllerPath = controllerPath.map(function(v) {
      return inflect.underscore(v);
    });

    let fullControllerName = inflect.classify(controllerPath.concat([controllerName]).join('_'));
    let fullControllerPath = controllerPath.concat([inflect.underscore(controllerName) + '.js']);

    let createPath = [controllerDir].concat(fullControllerPath).join('/');

    if (fs.existsSync(createPath)) {
      return callback(new Error('Controller already exists'));
    }

    while (controllerPath.length && (cd += '/' + controllerPath.shift()) && !fs.existsSync(cd)) {
      fs.mkdirSync(cd);
      cd += '/' + controllerPath.shift();
    }

    fs.writeFileSync(createPath, generateController(fullControllerName, forModel));

    console.log(colors.green.bold('Create: ') + createPath);

    generateRoute(fullControllerName, fullControllerPath, controllerRoute);

    callback(null);

  }

}

module.exports = GenerateControllerCommand;
