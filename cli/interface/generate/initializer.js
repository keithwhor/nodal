module.exports = (function() {

  'use strict';

  let fs = require('fs');

  let colors = require('colors/safe');
  let inflect = require('i')();

  let dot = require('dot');
  let templateSettings = Object.keys(dot.templateSettings).reduce((o, k) => {
    o[k] = dot.templateSettings[k];
    return o;
  }, {})
  templateSettings.strip = false;
  templateSettings.varname = 'data';

  let initializerDir = './initializers';

  function generateinitializer(initializerName) {

    let initializer = {
      name: initializerName,
    };

    var fn = dot.template(
      fs.readFileSync(__dirname + '/templates/initializer.jst').toString(),
      templateSettings
    );

    return fn(initializer);

  }

  return {
    command: function(args, flags) {

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No initializer path specified.');
        return;
      }

      let initializerPath = args[0][0].split('/');
      let cd = initializerDir;

      let initializerName = inflect.classify(initializerPath.pop());

      initializerPath = initializerPath.map(function(v) {
        return inflect.underscore(v);
      });

      let createPath = [initializerDir].concat(initializerPath).join('/') + '/' + inflect.underscore(initializerName) + '_initializer.js';

      if (fs.existsSync(createPath)) {
        throw new Error('initializer already exists');
      }

      while (initializerPath.length && (cd += '/' + initializerPath.shift()) && !fs.existsSync(cd)) {
        fs.mkdirSync(cd);
        cd += '/' + initializerPath.shift();
      }

      fs.writeFileSync(createPath, generateinitializer(initializerName));

      console.log(colors.green.bold('Create: ') + createPath);

      process.exit(0);

    }
  };

})();
