module.exports = (() => {

  'use strict';

  class Test {

    constructor(testRunner) {

      this.testRunner = testRunner;
      Object.defineProperty(this, 'app', {get: () => this.testRunner.app});

    }

    __test__(verb) {

      describe(this.constructor.name, () => {

        before(this.before.bind(this, verb));

        this.test(verb);

        after(this.after.bind(this, verb));

      });

    }

    before() {}

    test() {}

    after() {}

  }

  return Test;

})();
