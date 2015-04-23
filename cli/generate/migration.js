module.exports = (function() {

  var fs = require('fs');
  var inflect = require('i')();
  var colors = require('colors/safe');

  var migrationDir = './db/migrations';

  function composeMigration(up, down) {

    var hasInstructions = false;

    if (up || down) {
      hasInstructions = true;
    }

    up =  up || [];
    down = down || [];

    var fnAddPadding = function(v) { return '        ' + v; };

    up = up.map(fnAddPadding);
    down = down.map(fnAddPadding);

    return function(migrationName, id) {

      return [
        'module.exports = (function() {',
        '',
        '  var Nodal = require(\'nodal\');',
        '  var Migration = Nodal.Migration;',
        '',
        '  function ' + migrationName + '(db) {',
        '',
        '    Migration.apply(this, arguments);',
        '',
        '    this.id = ' + (parseInt(id) || 0) + ';',
        '',
        '  }',
        '',
        '  ' + migrationName + '.prototype = Object.create(Migration.prototype);',
        '  ' + migrationName + '.prototype.constructor = ' + migrationName + ';',
        '',
        '  ' + migrationName + '.prototype.up = function() {',
        '',
        '    return [',
        '',
        hasInstructions ? up.join('\n') : '',
        '',
        '    ];',
        '',
        '  };',
        '',
        '  ' + migrationName + '.prototype.down = function() {',
        '',
        '    return [',
        '',
        hasInstructions ? down.join('\n') : '',
        '',
        '    ];',
        '',
        '  };',
        '',
        '  return ' + migrationName + ';',
        '',
        '})();',
        ''
      ].join('\n');

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
      [date.getUTCSeconds(), 2]
    ].map(function(v) {
      return padZero.apply(null, v);
    }).join(''));

  }

  function generateMigration(migrationName, up, down) {

    var id = generateId(new Date());
    var migrationFileName = id + '__' + inflect.underscore(migrationName) + '.js';

    !fs.existsSync(migrationDir) && fs.mkdirSync(migrationDir);

    var migrationPath = migrationDir + '/' + migrationFileName;

    if (fs.existsSync(migrationPath)) {
      throw new Error('Migration already exists');
    }

    fs.writeFileSync(migrationPath, composeMigration(up, down)(migrationName, id));

    console.log(colors.green.bold('Create: ') + migrationPath);

  }

  return {
    command: function(args, flags) {

      var migrationName = inflect.camelize(args[0][0]);

      if (!migrationName) {
        throw new Error('Migration name not specified');
      }

      generateMigration(migrationName);

      process.exit(0);

    },
    generate: generateMigration
  };

})();
