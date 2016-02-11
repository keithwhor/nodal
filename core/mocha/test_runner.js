module.exports = (() => {

  'use strict';

  const fs = require('fs');
  const path = require('path');

  class TestRunner {

    constructor(dir, router) {

      let tests = [];

      let addTest = dir => {

        return filename => {

          if (!path.extname(filename) && filename[0] !== '.') {

            let nextDir = path.resolve(dir, filename);
            return fs.readdirSync(nextDir).forEach(addCommand(nextDir));

          }

          let Test = require(path.resolve(dir, filename));
          tests.push(new Test(this));

        }

      };

      let testDir = path.resolve(process.cwd(), dir || '/');
      fs.readdirSync(testDir).forEach(addTest(testDir));

      this._tests = tests;
      this.router = router;

    }

    start(verb) {

      this._tests.forEach(t => {

        t.__test__(verb);

      });

    }

  }

  return TestRunner;

})();
