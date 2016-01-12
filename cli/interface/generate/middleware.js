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

  let middlewareDir = './middleware';

  function generateMiddleware(middlewareName) {

    let middleware = {
      name: middlewareName,
    };

    var fn = dot.template(
      fs.readFileSync(__dirname + '/templates/middleware.jst').toString(),
      templateSettings
    );

    return fn(middleware);

  }

  return {
    command: function(args, flags) {

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No middleware path specified.');
        return;
      }

      let middlewarePath = args[0][0].split('/');
      let cd = middlewareDir;

      let middlewareName = inflect.classify(middlewarePath.pop());

      middlewarePath = middlewarePath.map(function(v) {
        return inflect.underscore(v);
      });

      let createPath = [middlewareDir].concat(middlewarePath).join('/') + '/' + inflect.underscore(middlewareName) + '_middleware.js';

      if (fs.existsSync(createPath)) {
        throw new Error('middleware already exists');
      }

      while (middlewarePath.length && (cd += '/' + middlewarePath.shift()) && !fs.existsSync(cd)) {
        fs.mkdirSync(cd);
        cd += '/' + middlewarePath.shift();
      }

      fs.writeFileSync(createPath, generateMiddleware(middlewareName));

      console.log(colors.green.bold('Create: ') + createPath);

      process.exit(0);

    }
  };

})();
