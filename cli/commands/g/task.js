'use strict';

const Command = require('cmnd').Command;

const fs = require('fs');

const colors = require('colors/safe');
const inflect = require('i')();

const dot = require('dot');

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
    fs.readFileSync(__dirname + '/../../templates/task.jst').toString(),
    templateSettings
  );

  return fn(task);

}

class GenerateTaskCommand extends Command {

  constructor() {

    super('g', 'task');

  }

  help() {

    return {
      description: 'Generates a new task',
      args: ['task name']
    };

  }

  run(params, callback) {

    if (!params.args.length) {
      return callback(new Error('No task path specified.'));
    }

    let taskPath = params.args[0].split('/');
    let cd = taskPath

    let taskName = inflect.classify(taskPath.pop());

    taskPath = taskPath.map(function(v) {
      return inflect.underscore(v);
    });

    let createPath = [taskDir].concat(taskPath).join('/') + '/' + inflect.underscore(taskName) + '.js';

    if (fs.existsSync(createPath)) {
      return callback(new Error('task already exists'));
    }

    while (taskPath.length && (cd += '/' + taskPath.shift()) && !fs.existsSync(cd)) {
      fs.mkdirSync(cd);
      cd += '/' + taskPath.shift();
    }

    fs.writeFileSync(createPath, generateTask(taskName));

    console.log(colors.green.bold('Create: ') + createPath);

    callback(null);

  }

}

module.exports = GenerateTaskCommand;
