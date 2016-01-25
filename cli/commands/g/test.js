module.exports = (() => {

  'use strict';

  const GenerateCommand = require('../../generate_command.js');

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
      fs.readFileSync(__dirname + '/../../interface/generate/templates/test.jst').toString(),
      templateSettings
    );

    return fn(test);

  }

  return new GenerateCommand(
    'test <test name>',
    {definition: 'Add a new test'},
    (args, flags, callback) => {

      if (!args.length) {
        console.error(colors.red.bold('Error: ') + 'No test path specified.');
        return;
      }

      let testPath = args[0][0].split('/');
      let cd = testPath;

      let testName = inflect.classify(testPath.pop()) + 'Test';

      testPath = testPath.map(function(v) {
        return inflect.underscore(v);
      });

      let createPath = [testDir].concat(testPath).join('/') + '/' + inflect.underscore(testName) + '.js';

      if (fs.existsSync(createPath)) {
        throw new Error('test already exists');
      }

      while (testPath.length && (cd += '/' + testPath.shift()) && !fs.existsSync(cd)) {
        fs.mkdirSync(cd);
        cd += '/' + testPath.shift();
      }

      fs.writeFileSync(createPath, generateTest(testName));

      console.log(colors.green.bold('Create: ') + createPath);

      process.exit(0);

    }
  );

})();
