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

  let taskDir = './tasks';

  function generateTask(taskName) {

    let task = {
      name: taskName,
    };

    var fn = dot.template(
      fs.readFileSync(__dirname + '/templates/task.jst').toString(),
      templateSettings
    );

    return fn(task);

  }

  return {
    command: function(args, flags) {

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No task path specified.');
        return;
      }

      let taskPath = args[0][0].split('/');
      let cd = taskPath;

      let taskName = inflect.classify(taskPath.pop());

      taskPath = taskPath.map(function(v) {
        return inflect.underscore(v);
      });

      let createPath = [taskDir].concat(taskPath).join('/') + '/' + inflect.underscore(taskName) + '.js';

      if (fs.existsSync(createPath)) {
        throw new Error('task already exists');
      }

      while (taskPath.length && (cd += '/' + taskPath.shift()) && !fs.existsSync(cd)) {
        fs.mkdirSync(cd);
        cd += '/' + taskPath.shift();
      }

      fs.writeFileSync(createPath, generateTask(taskName));

      console.log(colors.green.bold('Create: ') + createPath);

      process.exit(0);

    }
  };

})();
