module.exports = (function() {

  var fs = require('fs');
  var dot = require('dot');

  var config = {
    env: process.env.NODE_ENV || 'development'
  };

  var credentials;

  var varname = dot.templateSettings.varname;

  dot.templateSettings.varname = 'env';

  try {
    credentials = fs.readFileSync(process.cwd() + '/db/credentials.json');
    credentials = dot.template(credentials)(process.env);
    credentials = JSON.parse(credentials);
  } catch(e) {
    credentials = {};
  }

  dot.templateSettings.varname = varname;

  config.db = credentials[config.env];

  return config;

})();
