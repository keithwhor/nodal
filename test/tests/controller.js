module.exports = Nodal => {

  'use strict';

  let expect = require('chai').expect;

  describe('Nodal.Controller', () => {

    const c = new Nodal.Controller('/abc/def', 'GET');

    it('Should set security policy properly', () => {

      c.securityPolicy('script-src', 'self');
      c.securityPolicy('script-src', 'http://nodaljs.com');
      c.securityPolicy('connect-src', 'https://nodaljs.com');

      let getDirective = (directive) => {
        let i = header.indexOf(directive) + directive.length;
        let end = header.indexOf(';', i);
        end = end === -1 ? header.length : end;
        let directiveVal = header.substring(i, end);
        return directiveVal;
      }

      let header = c.getHeader('Content-Security-Policy');
      let val;

      expect(header).to.contain('script-src');
      expect(header).to.contain('connect-src');

      val = getDirective('script-src');

      expect(val).to.contain(`'self'`);
      expect(val).to.contain('http://nodaljs.com');

      val = getDirective('connect-src');

      expect(val).to.contain('https://nodaljs.com');

    });

  });

};
