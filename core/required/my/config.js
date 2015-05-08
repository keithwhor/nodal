module.exports = (function(rootDirectory) {

  var fs = require('fs');
  var dot = require('dot');

  var config = {
    env: process.env.NODE_ENV || 'development',
  };

  var credentials, secrets;

  var varname = dot.templateSettings.varname;

  dot.templateSettings.varname = 'env';

  var dir = rootDirectory + '/config';
  var configFiles = fs.readdirSync(dir);

  var ext = '.json';

  configFiles.filter(function(filename) {
    var name = filename.substr(0, filename.length - ext.length);
    return !config[name] && filename.substr(filename.length - ext.length) === ext;
  }).forEach(function(filename) {

    var configData;

    try {
      configData = fs.readFileSync([dir, filename].join('/'));
      configData = dot.template(configData)(process.env);
      configData = JSON.parse(configData);
    } catch(e) {
      configData = {};
    }

    config[filename.substr(0, filename.length - ext.length)] = configData[config.env];

  });

  dot.templateSettings.varname = varname;

  return config;

});
