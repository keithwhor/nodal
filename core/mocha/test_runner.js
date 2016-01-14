module.exports = (() => {

  'use strict';

  const fs = require('fs');
  const path = require('path');
  const seedCommand = require('../../cli/commands/db/seed.js');

  class TestRunner {

    constructor(dir) {

      let tests = [];

      let addTest = dir => {

        return filename => {

          if (!path.extname(filename)) {

            if (filename !== '.' && filename !== '..') {
              let nextDir = path.resolve(dir, filename);
              return fs.readdirSync(nextDir).forEach(addCommand(nextDir));
            }

            return;

          }

          let Test = require(path.resolve(dir, filename));

          tests.push(new Test(this));

        }

      };

      let testDir = path.resolve(process.cwd(), dir || '/');
      fs.readdirSync(testDir).forEach(addTest(testDir));

      this._tests = tests;

    }

    ready(app) {

      this.app = app;

    }

    start(verb) {

      this._tests.forEach(t => {

        t.__test__(verb);

      });

    }

  }

  return TestRunner;

})();
