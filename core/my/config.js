'use strict';

// Load env anew every time config is loaded
const env = require('./../env.js')();

const fs = require('fs');
const path = require('path');
const dot = require('dot');

let config = {};

let varname = dot.templateSettings.varname;

dot.templateSettings.varname = 'env';

let dir = path.join(env.rootDirectory, 'config');
let configFiles = fs.readdirSync(dir);

const ext = '.json';

configFiles.filter(function(filename) {
  let name = path.basename(filename, ext);
  return !config[name] && path.extname(filename) === ext;
}).forEach(function(filename) {

  let configData;

  try {
    configData = fs.readFileSync(path.join(dir, filename));
    configData = dot.template(configData)(process.env);
    configData = JSON.parse(configData);
  } catch(e) {
    throw new Error(`Could not parse "config/${filename}": Invalid JSON`);
  }

  config[path.basename(filename, ext)] = configData[env.name];

});

dot.templateSettings.varname = varname;

module.exports = config;
