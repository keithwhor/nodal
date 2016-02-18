module.exports = (function() {
  'use strict';

  let fs = require('fs');
  let inflect = require('i')();
  let colors = require('colors/safe');
  let dot = require('dot');

  let templateSettings = Object.keys(dot.templateSettings).reduce((o, k) => {
    o[k] = dot.templateSettings[k];
    return o;
  }, {})
  templateSettings.strip = false;
  templateSettings.varname = 'data';

  let migrationDir = './db/migrations';

  function composeMigration(up, down) {

    up =  up || [];
    down = down || [];

    return function(migrationName, id) {

      let migration = {
        up: up,
        down: down,
        name: migrationName,
        id: parseInt(id) || 0
      };

      return dot.template(
        fs.readFileSync(__dirname + '/templates/migration.jst').toString(),
        templateSettings
      )(migration);

    };

  }

  function generateId(date) {

    function padZero(n, l) {

      n = n.toString();
      return Array(1 + Math.max(0, l - n.length)).join('0') + n;

    }

    return parseInt([
      [date.getUTCFullYear(), 4],
      [date.getUTCMonth() + 1, 2],
      [date.getUTCDate(), 2],
      [date.getUTCHours(), 2],
      [date.getUTCMinutes(), 2],
      [date.getUTCSeconds(), 2],
      [(date.getUTCMilliseconds() / 10) | 0, 2]
    ].map(function(v) {
      return padZero.apply(null, v);
    }).join(''));

  }

  function generateMigration(migrationName, up, down, id) {

    id = id || generateId(new Date());
    let migrationFileName = id + '__' + inflect.underscore(migrationName) + '.js';

    !fs.existsSync(migrationDir) && fs.mkdirSync(migrationDir);

    let migrationPath = migrationDir + '/' + migrationFileName;

    if (fs.existsSync(migrationPath)) {
      throw new Error('Migration already exists');
    }

    fs.writeFileSync(migrationPath, composeMigration(up, down)(migrationName, id));

    console.log(colors.green.bold('Create: ') + migrationPath);

  }

  return {
    command: function(args, flags) {

      let migrationName = inflect.camelize(args[0][0]);

      if (!migrationName) {
        throw new Error('Migration name not specified');
      }

      let up = [];
      let down = [];

      if (flags.for) {
        let table = inflect.tableize(flags.for);
        args.slice(1).forEach(field => {
          up.push(`this.addColumn('${table}', '${field[0]}', '${field[1]}')`);
          down.unshift(`this.dropColumn('${table}', '${field[0]}')`);
        });
      }

      generateMigration(migrationName, up, down);

      process.exit(0);

    },
    generate: generateMigration
  };

})();
