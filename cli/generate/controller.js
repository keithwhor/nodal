"use strict";

module.exports = (function() {

  let fs = require('fs');

  let colors = require('colors/safe');
  let inflect = require('i')();

  let dot = require('dot');

  dot.templateSettings.strip = false;
  dot.templateSettings.varname = 'data';

  let controllerDir = './app/controllers';

  function generateController(controllerName, forModel) {

    let controller = {
      name: controllerName,
      for: forModel
    };

    var fn = dot.template(
      fs.readFileSync(__dirname + '/templates/controller.jst').toString()
    );

    return fn(controller);

  }

  return {
    command: function(args, flags) {

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No controller path specified.');
        return;
      }

      let controllerPath = args[0][0].split('/');
      let cd = controllerDir;

      let forModel = null;
      if (flags.for) {

        forModel = {
          name: inflect.classify(flags.for),
          path: 'app/models/' + inflect.underscore(inflect.classify(flags.for)) + '.js'
        };

        controllerPath.push(inflect.tableize(forModel.name));

      }

      let controllerName = inflect.classify(controllerPath.pop() + '_controller');

      controllerPath = controllerPath.map(function(v) {
        return inflect.underscore(v);
      });

      let fullControllerName = inflect.classify(controllerPath.concat([controllerName]).join('_'));

      let createPath = [controllerDir].concat(controllerPath).join('/') + '/' + inflect.underscore(controllerName) + '.js';

      if (fs.existsSync(createPath)) {
        throw new Error('Controller already exists');
      }

      while (controllerPath.length && (cd += '/' + controllerPath.shift()) && !fs.existsSync(cd)) {
        fs.mkdirSync(cd);
        cd += '/' + controllerPath.shift();
      }

      fs.writeFileSync(createPath, generateController(fullControllerName, forModel));

      console.log(colors.green.bold('Create: ') + createPath);

      process.exit(0);

    }
  };

})();
