module.exports = Nodal => {

  'use strict';

  let expect = require('chai').expect;

  const utilities = require('../../core/required/utilities.js');

  describe('Utilities', () => {

    it('should parse regex from string with no named groups', () => {

      let parsed = utilities.parseRegexFromString('/api/v1');

      expect(parsed.names.length).to.equal(0);
      expect(parsed.regex.exec('/api/v1')).to.exist;
      expect(parsed.regex.exec('/api/v1/')).to.exist;
      expect(parsed.regex.exec('/api/v1/a')).to.not.exist;

    });

    it('should parse regex with an asterisk', () => {

      let parsed = utilities.parseRegexFromString('/api/*');

      expect(parsed.names.length).to.equal(1);
      expect(parsed.names[0]).to.be.undefined;
      expect(parsed.regex.exec('/api/v1')).to.exist;
      expect(parsed.regex.exec('/api/v1')[1]).to.equal('v1');
      expect(parsed.regex.exec('/api/v1/')).to.exist;
      expect(parsed.regex.exec('/api/v1/')[1]).to.equal('v1');
      expect(parsed.regex.exec('/api/v1/a')).to.exist;
      expect(parsed.regex.exec('/api/v1/a')[1]).to.equal('v1/a');

    });

    it('should parse regex from string with id named group', () => {

      let parsed = utilities.parseRegexFromString('/api/v1/:id');

      expect(parsed.names.length).to.equal(1);
      expect(parsed.names[0]).to.equal('id');
      expect(parsed.regex.exec('/api/v1')).to.exist;
      expect(parsed.regex.exec('/api/v1')[1]).to.not.exist;
      expect(parsed.regex.exec('/api/v1/')).to.exist;
      expect(parsed.regex.exec('/api/v1/')[1]).to.not.exist;
      expect(parsed.regex.exec('/api/v1/a')).to.exist;
      expect(parsed.regex.exec('/api/v1/a')[1]).to.equal('a');
      expect(parsed.regex.exec('/api/v1/a/')).to.exist;
      expect(parsed.regex.exec('/api/v1/a/')[1]).to.equal('a');
      expect(parsed.regex.exec('/api/v1/a/b')).to.not.exist;

    });

    it('should parse regex from string with two named groups', () => {

      let parsed = utilities.parseRegexFromString('/api/v1/:endpoint/:id');

      expect(parsed.names.length).to.equal(2);
      expect(parsed.names[0]).to.equal('endpoint');
      expect(parsed.names[1]).to.equal('id');
      expect(parsed.regex.exec('/api/v1')).to.not.exist;
      expect(parsed.regex.exec('/api/v1/')).to.not.exist;
      expect(parsed.regex.exec('/api/v1/a')).to.exist;
      expect(parsed.regex.exec('/api/v1/a')[1]).to.equal('a');
      expect(parsed.regex.exec('/api/v1/a')[2]).to.not.exist;
      expect(parsed.regex.exec('/api/v1/a/')).to.exist;
      expect(parsed.regex.exec('/api/v1/a/')[1]).to.equal('a');
      expect(parsed.regex.exec('/api/v1/a/')[2]).to.not.exist;
      expect(parsed.regex.exec('/api/v1/a/b')).to.exist;
      expect(parsed.regex.exec('/api/v1/a/b')[1]).to.equal('a');
      expect(parsed.regex.exec('/api/v1/a/b')[2]).to.equal('b');
      expect(parsed.regex.exec('/api/v1/a/b/')).to.exist;
      expect(parsed.regex.exec('/api/v1/a/b/')[1]).to.equal('a');
      expect(parsed.regex.exec('/api/v1/a/b/')[2]).to.equal('b');

    });

  });

};
