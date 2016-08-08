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

let middlewareDir = './middleware';

function generateMiddleware(middlewareName) {

  let middleware = {
    name: middlewareName,
  };

  var fn = dot.template(
    fs.readFileSync(__dirname + '/../../templates/middleware.jst').toString(),
    templateSettings
  );

  return fn(middleware);

}

class GenerateMiddlewareCommand extends Command {

  constructor() {

    super('g', 'middleware');

  }

  help() {

    return {
      description: 'Generate new Middleware (runs pre-controller)',
      args: ['middleware name']
    };

  }

  run(params, callback) {

    if (!params.args.length) {
      return callback(new Error('No middleware path specified.'));
    }

    let middlewarePath = params.args[0].split('/');
    let cd = middlewareDir;

    let middlewareName = inflect.classify(middlewarePath.pop());

    middlewarePath = middlewarePath.map(function(v) {
      return inflect.underscore(v);
    });

    let createPath = [middlewareDir].concat(middlewarePath).join('/') + '/' + inflect.underscore(middlewareName) + '_middleware.js';

    if (fs.existsSync(createPath)) {
      return callback(new Error('middleware already exists'));
    }

    while (middlewarePath.length && (cd += '/' + middlewarePath.shift()) && !fs.existsSync(cd)) {
      fs.mkdirSync(cd);
      cd += '/' + middlewarePath.shift();
    }

    fs.writeFileSync(createPath, generateMiddleware(middlewareName));

    console.log(colors.green.bold('Create: ') + createPath);

    callback(null);

  }

}

module.exports = GenerateMiddlewareCommand;
