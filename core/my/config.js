module.exports = (() => {

    'use strict';

const env = require('./../env.js');

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
  let extension = path.extname(filename)
    , name = path.basename(filename, extension);
  return !config[name] && extension === ext;
}).forEach(function(filename) {  // todo: this code may be async

  let configData;

  try {
    configData = fs.readFileSync(path.join(dir, filename));
    configData = dot.template(configData)(process.env);
    configData = JSON.parse(configData);
  } catch(e) {
    throw new Error(`Could not parse "config/${filename}": Invalid JSON`);
  }
  config[path.basename(filename, ext)] = configData;
});

dot.templateSettings.varname = varname;

return config;

})();
