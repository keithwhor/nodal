module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  /* Include this file to enable Model relationships */

  /* For example...

    const Post = Nodal.require('app/models/post.js');
    const Comment = Nodal.require('app/models/comment.js');

    Comment.joinsTo(Post, {multiple: true});

  */

  return true;

})();
