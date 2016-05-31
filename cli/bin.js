#!/usr/bin/env node

'use strict';

const CLI = require('./cli.js');
if (process.argv.length > 2) {
  CLI.run(process.argv.slice(2));
} else {
  CLI.run(['help']);
}
