'use strict';

module.exports = Nodal => {

  const async = require('async');

  let expect = require('chai').expect;

  describe('Nodal.API', function() {

    let schemaPost = {
      table: 'posts',
      columns: [
        {name: 'id', type: 'serial'},
        {name: 'title', type: 'string'},
        {name: 'body', type: 'string'},
        {name: 'created_at', type: 'datetime'},
        {name: 'updated_at', type: 'datetime'}
      ]
    };

    class Post extends Nodal.Model {}
    Post.setSchema(schemaPost);

    it('should output one post properly', () => {

      let post = new Post({title: 'Howdy', body: 'hello world'});

      let output = Nodal.API.format(post);
      expect(output).to.have.ownProperty('meta');
      expect(output).to.have.ownProperty('data');
      expect(output.data.length).to.equal(1);
      expect(output.data[0].title).to.equal('Howdy');
      expect(output.meta.count).to.equal(1);
      expect(output.meta.total).to.equal(1);
      expect(output.meta.offset).to.equal(0);

    });

    it('should output posts properly', () => {

      let posts = Nodal.ModelArray.from([
        new Post({title: 'What', body: 'Test post A'}),
        new Post({title: 'Who', body: 'Test post B'}),
        new Post({title: 'When', body: 'Test post C'}),
        new Post({title: 'Where', body: 'Test post D'}),
      ]);

      posts.setMeta({offset: 1, total: 10});

      let output = Nodal.API.format(posts);

      expect(output).to.have.ownProperty('meta');
      expect(output).to.have.ownProperty('data');
      expect(output.data.length).to.equal(4);
      expect(output.data[0].title).to.equal('What');
      expect(output.data[3].title).to.equal('Where');
      expect(output.meta.count).to.equal(4);
      expect(output.meta.total).to.equal(10);
      expect(output.meta.offset).to.equal(1);

    });

    it('should format ItemArrays properly', () => {

      let groups = Nodal.ItemArray.from([
        {count: 5, color: 'red'},
        {count: 6, color: 'green'},
        {count: 7, color: 'blue'}
      ]);

      groups.setMeta({offset: 1, total: 10});

      let output = Nodal.API.format(groups);

      expect(output).to.have.ownProperty('meta');
      expect(output).to.have.ownProperty('data');
      expect(output.data.length).to.equal(3);
      expect(output.data[0].color).to.equal('red');
      expect(output.data[2].color).to.equal('blue');
      expect(output.meta.count).to.equal(3);
      expect(output.meta.total).to.equal(10);
      expect(output.meta.offset).to.equal(1);

    });

    it('should format ItemArrays properly with include', () => {

      let groups = Nodal.ItemArray.from([
        {count: 5, color: 'red'},
        {count: 6, color: 'green'},
        {count: 7, color: 'blue'}
      ]);

      groups.setMeta({offset: 1, total: 10});

      let output = Nodal.API.format(groups, ['color']);

      expect(output).to.have.ownProperty('meta');
      expect(output).to.have.ownProperty('data');
      expect(output.data.length).to.equal(3);
      expect(output.data[0]).to.haveOwnProperty('color');
      expect(output.data[0]).to.not.haveOwnProperty('count');

    });

  });

};
