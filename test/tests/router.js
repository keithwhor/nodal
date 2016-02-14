module.exports = Nodal => {

  'use strict';

  let expect = require('chai').expect;

  describe('Router', () => {

    const router = new Nodal.Router();
    let route = null;

    it('Should parsePath correctly, given query string',  () => {

      expect(router.parsePath('/abc/def/?q=2')).to.equal('/abc/def');
      expect(router.parsePath('/abc/def/')).to.equal('/abc/def');
      expect(router.parsePath('/abc/def')).to.equal('/abc/def');

    });

    it('Should create route', () => {

      route = router.route('/abc/{id}');
      route.use(Nodal.Controller);

      expect(route).to.exist;

    });

    it('Should find route', () => {

      expect(router.find('/abc')).to.equal(route);
      expect(router.find('/abc/')).to.equal(route);
      expect(router.find('/abc/1')).to.equal(route);
      expect(router.find('/abc?a=1')).to.equal(route);
      expect(router.find('/abc/?a=1')).to.equal(route);
      expect(router.find('/abc/1?a=1')).to.equal(route);

    });

    it('Should parse query parameters', () => {

      let qp = router.parseQueryParameters({a: '1', b: '2', c: '3'});

      expect(qp.a).to.equal('1');
      expect(qp.b).to.equal('2');
      expect(qp.c).to.equal('3');

    });

    it('Should parse body (string) from application/x-www-form-urlencoded', () => {

      let qp = router.parseBody('a=1&b=2&c=3', {'content-type': 'application/x-www-form-urlencoded'});

      expect(qp.a).to.equal('1');
      expect(qp.b).to.equal('2');
      expect(qp.c).to.equal('3');

    });

    it('Should parse body (string) from application/json', () => {

      let qp = router.parseBody('{"a":"1","b":"2","c":"3"}', {'content-type': 'application/json'});

      expect(qp.a).to.equal('1');
      expect(qp.b).to.equal('2');
      expect(qp.c).to.equal('3');

    });

    it('Should parse body (buffer) from application/x-www-form-urlencoded', () => {

      let qp = router.parseBody(new Buffer('a=1&b=2&c=3'), {'content-type': 'application/x-www-form-urlencoded'});

      expect(qp.a).to.equal('1');
      expect(qp.b).to.equal('2');
      expect(qp.c).to.equal('3');

    });

    it('Should parse body (buffer) from application/json', () => {

      let qp = router.parseBody(new Buffer('{"a":"1","b":"2","c":"3"}'), {'content-type': 'application/json'});

      expect(qp.a).to.equal('1');
      expect(qp.b).to.equal('2');
      expect(qp.c).to.equal('3');

    });

    it('Should prepare route matches properly', () => {

      let routeData = router.prepare('::1', '/abc/123', 'GET', {}, '');

      expect(routeData.matches).to.exist;
      expect(routeData.matches[0]).to.equal('123');
      expect(routeData.route.id).to.equal('123');

    });

  });

};
