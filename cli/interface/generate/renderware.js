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

  let renderwareDir = './renderware';

  function generateRenderware(renderwareName) {

    let renderware = {
      name: renderwareName,
    };

    var fn = dot.template(
      fs.readFileSync(__dirname + '/templates/renderware.jst').toString(),
      templateSettings
    );

    return fn(renderware);

  }

  return {
    command: function(args, flags) {

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No renderware path specified.');
        return;
      }

      let renderwarePath = args[0][0].split('/');
      let cd = renderwareDir;

      let renderwareName = inflect.classify(renderwarePath.pop());

      renderwarePath = renderwarePath.map(function(v) {
        return inflect.underscore(v);
      });

      let createPath = [renderwareDir].concat(renderwarePath).join('/') + '/' + inflect.underscore(renderwareName) + '_renderware.js';

      if (fs.existsSync(createPath)) {
        throw new Error('renderware already exists');
      }

      while (renderwarePath.length && (cd += '/' + renderwarePath.shift()) && !fs.existsSync(cd)) {
        fs.mkdirSync(cd);
        cd += '/' + renderwarePath.shift();
      }

      fs.writeFileSync(createPath, generateRenderware(renderwareName));

      console.log(colors.green.bold('Create: ') + createPath);

      process.exit(0);

    }
  };

})();
