module.exports = (function(Nodal) {

  'use strict';

  const async = require('async');

  let expect = require('chai').expect;

  describe('Nodal.RelationshipGraph', function() {

    let Relationships = new Nodal.RelationshipGraph();

    class User extends Nodal.Model {}
    class Post extends Nodal.Model {}
    class Avatar extends Nodal.Model {}

    Relationships.of(Post).joinsTo(User, {multiple: true});
    Relationships.of(Avatar).joinsTo(User);


    it('Should find posts in user', () => {

      let rpath = Relationships.of(User).find('posts');

      expect(rpath).to.exist;
      expect(rpath.path.length).to.equal(3);
      expect(rpath.path[0].Model).to.equal(Post);
      expect(rpath.multiple()).to.equal(true);

    });

    it('Should find avatar in user', () => {

      let rpath = Relationships.of(User).find('avatar');

      expect(rpath).to.exist;
      expect(rpath.path.length).to.equal(3);
      expect(rpath.getModel()).to.equal(Avatar);
      expect(rpath.multiple()).to.equal(false);

    });

    it('Should find user in post', () => {

      let rpath = Relationships.of(Post).find('user');

      expect(rpath).to.exist;
      expect(rpath.path.length).to.equal(3);
      expect(rpath.getModel()).to.equal(User);
      expect(rpath.multiple()).to.equal(false);

    });

    it('Should find user in avatar', () => {

      let rpath = Relationships.of(Avatar).find('user');

      expect(rpath).to.exist;
      expect(rpath.path.length).to.equal(3);
      expect(rpath.getModel()).to.equal(User);
      expect(rpath.multiple()).to.equal(false);

    });

    it('Should find avatar from post', () => {

      let rpath = Relationships.of(Post).find('avatar');

      expect(rpath).to.exist;
      expect(rpath.path.length).to.equal(5);
      expect(rpath.getModel()).to.equal(Avatar);
      expect(rpath.path[2].Model).to.equal(User);
      expect(rpath.multiple()).to.equal(false);

    });

    it('Should find post from avatar', () => {

      let rpath = Relationships.of(Avatar).find('posts');

      expect(rpath).to.exist;
      expect(rpath.path.length).to.equal(5);
      expect(rpath.getModel()).to.equal(Post);
      expect(rpath.path[2].Model).to.equal(User);
      expect(rpath.multiple()).to.equal(true);

    });

  });

});
