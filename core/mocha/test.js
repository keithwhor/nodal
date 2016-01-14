module.exports = (() => {

  'use strict';

  class Test {

    constructor(testRunner) {

      this.testRunner = testRunner;
      Object.defineProperty(this, 'app', {get: () => this.testRunner.app});

    }

    __test__(verb) {

      describe(this.constructor.name, () => {

        this.before && before(this.before.bind(this, verb));

        this.test(verb);

        this.after && after(this.after.bind(this, verb));

      });

    }

    test() {}

  }

  return Test;

})();
