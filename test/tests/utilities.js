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
      expect(parsed.regex.exec('/api')).to.exist;
      expect(parsed.regex.exec('/api/')).to.exist;
      expect(parsed.regex.exec('/api/v1')).to.exist;
      expect(parsed.regex.exec('/api/v1')[1]).to.equal('v1');
      expect(parsed.regex.exec('/api/v1/')).to.exist;
      expect(parsed.regex.exec('/api/v1/')[1]).to.equal('v1');
      expect(parsed.regex.exec('/api/v1/a')).to.exist;
      expect(parsed.regex.exec('/api/v1/a')[1]).to.equal('v1/a');

    });

    it('should parse regex from string with id named group', () => {

      let parsed = utilities.parseRegexFromString('/api/v1/{id}');

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

      let parsed = utilities.parseRegexFromString('/api/v1/{endpoint}/{id}');

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

    it('should parse sizes properly', () => {

      expect(utilities.parseSize('lol')).to.equal(0);
      expect(utilities.parseSize('M')).to.equal(0);
      expect(utilities.parseSize('')).to.equal(0);

      expect(utilities.parseSize('2')).to.equal(2);
      expect(utilities.parseSize('2B')).to.equal(2);
      expect(utilities.parseSize('2k')).to.equal(2 * 1024);
      expect(utilities.parseSize('2kB')).to.equal(2 * 1024);
      expect(utilities.parseSize('2M')).to.equal(2 * 1024 * 1024);
      expect(utilities.parseSize('2MB')).to.equal(2 * 1024 * 1024);
      expect(utilities.parseSize('2G')).to.equal(2 * 1024 * 1024 * 1024);
      expect(utilities.parseSize('2GB')).to.equal(2 * 1024 * 1024 * 1024);

      expect(utilities.parseSize('2.0')).to.equal(2);
      expect(utilities.parseSize('2.0B')).to.equal(2);
      expect(utilities.parseSize('2.0k')).to.equal(2 * 1024);
      expect(utilities.parseSize('2.0kB')).to.equal(2 * 1024);
      expect(utilities.parseSize('2.0M')).to.equal(2 * 1024 * 1024);
      expect(utilities.parseSize('2.0MB')).to.equal(2 * 1024 * 1024);
      expect(utilities.parseSize('2.0G')).to.equal(2 * 1024 * 1024 * 1024);
      expect(utilities.parseSize('2.0GB')).to.equal(2 * 1024 * 1024 * 1024);

      expect(utilities.parseSize('12.01')).to.equal(Math.ceil(12.01));
      expect(utilities.parseSize('12.01B')).to.equal(Math.ceil(12.01));
      expect(utilities.parseSize('12.01k')).to.equal(Math.ceil(12.01 * 1024));
      expect(utilities.parseSize('12.01kB')).to.equal(Math.ceil(12.01 * 1024));
      expect(utilities.parseSize('12.01M')).to.equal(Math.ceil(12.01 * 1024 * 1024));
      expect(utilities.parseSize('12.01MB')).to.equal(Math.ceil(12.01 * 1024 * 1024));
      expect(utilities.parseSize('12.01G')).to.equal(Math.ceil(12.01 * 1024 * 1024 * 1024));
      expect(utilities.parseSize('12.01GB')).to.equal(Math.ceil(12.01 * 1024 * 1024 * 1024));

    });

  });

};
