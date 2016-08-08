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

let renderwareDir = './renderware';

function generateRenderware(renderwareName) {

  let renderware = {
    name: renderwareName,
  };

  var fn = dot.template(
    fs.readFileSync(__dirname + '/../../templates/renderware.jst').toString(),
    templateSettings
  );

  return fn(renderware);

}

class GenerateRenderwareCommand extends Command {

  constructor() {

    super('g', 'renderware');

  }

  help() {

    return {
      description: 'Generate new Renderware (runs post-controller)',
      args: ['renderware name']
    };

  }

  run(params, callback) {

    if (!params.args.length) {
      return callback(new Error('No renderware path specified.'));
    }

    let renderwarePath = params.args[0].split('/');
    let cd = renderwareDir;

    let renderwareName = inflect.classify(renderwarePath.pop());

    renderwarePath = renderwarePath.map(function(v) {
      return inflect.underscore(v);
    });

    let createPath = [renderwareDir].concat(renderwarePath).join('/') + '/' + inflect.underscore(renderwareName) + '_renderware.js';

    if (fs.existsSync(createPath)) {
      return callback(new Error('renderware already exists'));
    }

    while (renderwarePath.length && (cd += '/' + renderwarePath.shift()) && !fs.existsSync(cd)) {
      fs.mkdirSync(cd);
      cd += '/' + renderwarePath.shift();
    }

    fs.writeFileSync(createPath, generateRenderware(renderwareName));

    console.log(colors.green.bold('Create: ') + createPath);

    callback(null);

  }

}

module.exports = GenerateRenderwareCommand;
