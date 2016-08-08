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

let testDir = './test/tests';

function generateTest(testName) {

  let test = {
    name: testName,
  };

  var fn = dot.template(
    fs.readFileSync(__dirname + '/../../templates/test.jst').toString(),
    templateSettings
  );

  return fn(test);

}

class GenerateTestCommand extends Command {

  constructor() {

    super('g', 'test');

  }

  help() {

    return {
      description: 'Generates a new test',
      args: ['test']
    };

  }

  run(params, callback) {

    if (!params.args.length) {
      return callback(new Error('No test path specified.'));
    }

    let testPath = params.args[0].split('/');
    let cd = testPath;

    let testName = inflect.classify(testPath.pop()) + 'Test';

    testPath = testPath.map(function(v) {
      return inflect.underscore(v);
    });

    let createPath = [testDir].concat(testPath).join('/') + '/' + inflect.underscore(testName) + '.js';

    if (fs.existsSync(createPath)) {
      callback(new Error('test already exists'));
    }

    while (testPath.length && (cd += '/' + testPath.shift()) && !fs.existsSync(cd)) {
      fs.mkdirSync(cd);
      cd += '/' + testPath.shift();
    }

    fs.writeFileSync(createPath, generateTest(testName));

    console.log(colors.green.bold('Create: ') + createPath);

    callback(null);

  }

}

module.exports = GenerateTestCommand;
