module.exports = (function() {

  var fs = require('fs');
  var dot = require('dot');

  var varname = dot.templateSettings.varname;
  var credentials;

  dot.templateSettings.varname = 'env';

  try {
    credentials = fs.readFileSync(process.cwd() + '/db/credentials.json');
    credentials = dot.template(credentials)(process.env);
    credentials = JSON.parse(credentials);
  } catch(e) {
    credentials = {};
  }

  dot.templateSettings.varname = varname;

  return credentials[process.env.NODE_ENV || 'development'];

})();
