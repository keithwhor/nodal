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
    let filter;

    if (process.argv.length > 3) {
      filter = process.argv[3];
      filter = filter.endsWith('.js') ? filter : `${filter}.js`;
    }

    let addTest = dir => {

      return filename => {

        if (!path.extname(filename) && filename[0] !== '.') {

          let nextDir = path.resolve(dir, filename);
          return fs.readdirSync(nextDir).forEach(addCommand(nextDir));

        }

        if (filter && filename !== filter) {
          return;
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
