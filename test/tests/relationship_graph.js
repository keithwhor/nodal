'use strict';

module.exports = Nodal => {

  const async = require('async');

  let expect = require('chai').expect;

  describe('Nodal.RelationshipGraph', function() {

    let Relationships = new Nodal.RelationshipGraph();

    class User extends Nodal.Model {}
    class Post extends Nodal.Model {}
    class Comment extends Nodal.Model {}
    class Avatar extends Nodal.Model {}

    Relationships.of(Post).joinsTo(User, {multiple: true});
    Relationships.of(Comment).joinsTo(Post, {multiple: true});
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

    it('Should trace nodes properly', () => {

      let rpath = Relationships.of(Avatar).find('posts');

      expect(rpath.path[1].parent.Model).to.equal(User);
      expect(rpath.path[1].child.Model).to.equal(Post);
      expect(rpath.path[3].parent.Model).to.equal(User);
      expect(rpath.path[3].child.Model).to.equal(Avatar);

    });

    it('Should get join name properly', () => {

      let rpath = Relationships.of(Avatar).find('comments');

      expect(rpath.joinName()).to.equal('user__posts__comments');
      expect(rpath.joinName(true)).to.equal('post__user__avatar');

    });

    it('Should trace nodes properly, explicitly', () => {

      let rpath = Relationships.of(Avatar).findExplicit('user__posts');

      expect(rpath.path[1].parent.Model).to.equal(User);
      expect(rpath.path[1].child.Model).to.equal(Post);
      expect(rpath.path[3].parent.Model).to.equal(User);
      expect(rpath.path[3].child.Model).to.equal(Avatar);

    });

    it('Should trace nodes properly, explicitly when not found', () => {

      let rpath = Relationships.of(Avatar).findExplicit('posts');

      expect(rpath).to.not.exist;

    });

    it('Should cascade properly', () => {

      let user = Relationships.of(User).cascade();
      let post = Relationships.of(Post).cascade();
      let comment = Relationships.of(Comment).cascade();
      let avatar = Relationships.of(Avatar).cascade();

      expect(user.length).to.equal(3);
      expect(user[0].getModel()).to.equal(Post);
      expect(user[0].path[1].child.Model).to.equal(Post);
      expect(user[0].path[1].parent.Model).to.equal(User);
      expect(user[1].getModel()).to.equal(Avatar);
      expect(user[1].path[1].child.Model).to.equal(Avatar);
      expect(user[1].path[1].parent.Model).to.equal(User);
      expect(user[2].getModel()).to.equal(Comment);
      expect(user[2].path[1].child.Model).to.equal(Comment);
      expect(user[2].path[1].parent.Model).to.equal(Post);
      expect(user[2].path[3].child.Model).to.equal(Post);
      expect(user[2].path[3].parent.Model).to.equal(User);
      expect(post.length).to.equal(1);
      expect(post[0].getModel()).to.equal(Comment);
      expect(comment.length).to.equal(0);
      expect(avatar.length).to.equal(0);

    });

  });

};
