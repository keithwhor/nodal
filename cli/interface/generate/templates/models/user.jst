module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const bcrypt = require('bcrypt');

  class User extends Nodal.Model {

    beforeSave(callback) {

      if (!this.hasErrors() && this.hasChanged('password')) {

        bcrypt.hash(this.get('password'), 10, (err, hash) => {

          if (err) {
            return callback(new Error('Could not encrypt password'));
          }

          this.__safeSet__('password', hash);
          callback();

        });

      } else {

        callback();

      }

    }

    verifyPassword(unencrypted, callback) {

      bcrypt.compare(unencrypted, this.get('password'), (err, result) => {
        callback.call(this, err, result);
      });

    }

  }

  User.setDatabase(Nodal.require('db/main.js'));
  User.setSchema(Nodal.my.Schema.models.User);

  User.validates('email', 'must be valid', v => v && (v + '').match(/.+@.+\.\w+/i));
  User.validates('password', 'must be at least 5 characters in length', v => v && v.length >= 5);

  return User;

})();
