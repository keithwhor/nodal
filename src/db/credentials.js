require('../config/settings.js');

module.exports = ({

  development: {
    host: 'localhost',
    port: '',
    user: '',
    password: '',
    database: ''
  },

  production: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DB
  }

})[global.settings.ENV || 'development'];
