module.exports = (function() {

  var fs = require('fs');

  var colors = require('colors/safe');
  var inflect = require('i')();

  var dot = require('dot');

  dot.templateSettings.strip = false;

  var controllerDir = './app/controllers';

  function generateController(controllerName, forModel) {

    var controller = {
      name: controllerName,
      for: forModel
    };

    return dot.template(
      fs.readFileSync(__dirname + '/templates/controller.jst', {
        varname: 'data',
        strip: false
      }).toString()
    )(controller);

  }

  return {
    command: function(args, flags) {

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No controller path specified.');
        return;
      }

      var controllerPath = args[0][0].split('/');
      var cd = controllerDir;

      var forModel = null;
      if (flags.for) {

        forModel = {
          name: inflect.classify(flags.for),
          path: 'app/models/' + inflect.underscore(inflect.classify(flags.for)) + '.js'
        };

        controllerPath.push(inflect.tableize(forModel.name));

      }

      var controllerName = inflect.classify(controllerPath.pop() + '_controller');

      controllerPath = controllerPath.map(function(v) {
        return inflect.underscore(v);
      });

      var fullControllerName = inflect.classify(controllerPath.concat([controllerName]).join('_'));

      var createPath = [controllerDir].concat(controllerPath).join('/') + '/' + inflect.underscore(controllerName) + '.js';

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
