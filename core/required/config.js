module.exports = (function() {

  var fs = require('fs');
  var dot = require('dot');

  var config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
  };

  var credentials, secrets;

  var varname = dot.templateSettings.varname;

  dot.templateSettings.varname = 'env';

  try {
    db = fs.readFileSync(process.cwd() + '/config/db.json');
    db = dot.template(db)(process.env);
    db = JSON.parse(db);
  } catch(e) {
    db = {};
  }

  try {
    secrets = fs.readFileSync(process.cwd() + '/config/secrets.json');
    secrets = dot.template(secrets)(process.env);
    secrets = JSON.parse(secrets);
  } catch(e) {
    secrets = {};
  }

  dot.templateSettings.varname = varname;

  config.db = db[config.env];
  config.secrets = secrets[config.env];

  return config;

})();
