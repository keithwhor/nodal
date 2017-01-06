'use strict';

const fs = require('fs');
const path = require('path');

class TestRunner {

  constructor(dir, router) {

    this.dir = dir;
    this.router = router;

  }

  tests() {

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

    let testDir = path.resolve(process.cwd(), this.dir || '/');
    fs.readdirSync(testDir).forEach(addTest(testDir));

    return tests;

  }

  start(verb) {

    this.tests().forEach(t => {

      t.__test__(verb);

    });

  }

}

module.exports = TestRunner;
