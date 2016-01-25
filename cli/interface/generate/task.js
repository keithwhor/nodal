module.exports = (function() {
  'use strict';

  let fs = require('fs');

  let colors = require('colors/safe');
  let inflect = require('i')();

  let dot = require('dot');

  // TODO: Possibly better optimized RegEx
  let durationMatcher = /((\d+(\.\d+)?)\s*(m|h|d|w|M|H|D|W))?/i

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


  function addScheduledTask(taskName, taskPath, frequency, duration) {

    let freqMap = {
      m: 'minutely',
      h: 'hourly',
      d: 'daily',
      w: 'weekly'
    }

    let importStatement = `const ${taskName} = Nodal.require('tasks/${taskPath}');`;
    let taskStatement = `scheduler.${freqMap[frequency]}(${duration}).perform(${taskName});`;

    let mainSchedular = fs.readFileSync('./schedulers/main.js').toString();

    mainSchedular = mainSchedular.split('\n');

    let importIndex = mainSchedular.map(function(v, i) {
      return {
        spaces: v.indexOf('/* generator: end imports */'),
        index: i
      }
    }).filter(function(v) {
      return v.spaces > -1;
    }).pop();

    if (importIndex !== undefined) {

      mainSchedular = mainSchedular.slice(0, importIndex.index - 1).concat(
        [
          Array(importIndex.spaces + 1).join(' ') + importStatement,
        ],
        mainSchedular.slice(importIndex.index - 1)
      );

    }

    let taskIndex = mainSchedular.map(function(v, i) {
      return {
        spaces: v.indexOf('/* generator: end tasks */'),
        index: i
      }
    }).filter(function(v) {
      return v.spaces > -1;
    }).pop();

    if (taskIndex !== undefined) {

      mainSchedular = mainSchedular.slice(0, taskIndex.index - 1).concat(
        [
          Array(taskIndex.spaces + 1).join(' ') + taskStatement,
        ],
        mainSchedular.slice(taskIndex.index - 1)
      );

    }

    fs.writeFileSync('./schedulers/main.js', mainSchedular.join('\n'));
    console.log(colors.green.bold('Modify: ') + './schedulers/main.js');

  }


  return {
    command: function(args, flags) {

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No task path specified.');
        return;
      }

      let scheduled = false;

      let taskPath = args[0][0].split('/');
      let cd = taskPath;

      let durationTime;
      let durationFreq;
      if (flags.schedule) {
        let matches = flags.schedule.match(durationMatcher)
        durationTime = matches[2];
        durationFreq = matches[4];
      }

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

      if (flags.schedule) {
        addScheduledTask(taskName, createPath, durationFreq.toLowerCase(), durationTime);
      }

      process.exit(0);

    }
  };

})();
