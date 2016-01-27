module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const User = Nodal.require('app/models/user.js');

  const crypto = require('crypto');

  class AccessToken extends Nodal.Model {

    static generateAccessTokenString() {

      return crypto
        .createHmac('md5', crypto.randomBytes(512).toString())
        .update([].slice.call(arguments).join(':'))
        .digest('hex');

    }

    static login(params, callback) {

      if (params.body.data.grant_type !== 'password') {
        return callback(new Error('Must supply grant_type'));
      }

      User.query()
        .where({username: params.body.data.username})
        .end((err, users) => {

          if (err || !users || !users.length) {

            return callback(new Error('User not found'));

          }

          let user = users[0];

          user.verifyPassword(params.body.data.password, (err, result) => {

            if (err || !result) {

              return callback(new Error('Invalid credentials'));

            }

            new AccessToken({
              user_id: user.get('id'),
              access_token: this.generateAccessTokenString(user.get('id'), user.get('email'), new Date().valueOf()),
              token_type: 'bearer',
              expires_at: (new Date(new Date().valueOf() + (30 * 24 * 60 * 60 * 1000))),
              ip_address: params.ip_address
            }).save(callback);

          });

        });

    }

    static verify(params, callback) {

      this.query()
        .join('user')
        .where({
          access_token: params.query.access_token,
          expires_at__gte: new Date()
        })
        .end((err, accessTokens) => {

          if (err || !accessTokens || !accessTokens.length) {

            return callback(new Error('Your access token is invalid.'));

          }

          let accessToken = accessTokens[0];

          if (!accessToken.joined('user')) {

            return callback(new Error('Your access token belongs to an invalid user.'));

          }

          return callback(null, accessToken, accessToken.joined('user'));

        });

    }

    static logout(params, callback) {

      this.verify(params, (err, accessToken) => {

        if (err) {
          return callback(err);
        }

        return accessToken.destroy(callback);

      });

    }

  }

  AccessToken.setDatabase(Nodal.require('db/main.js'));
  AccessToken.setSchema(Nodal.my.Schema.models.AccessToken);

  AccessToken.joinsTo(User, {multiple: true});

  return AccessToken;

})();
