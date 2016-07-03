'use strict';

const CommandLineInterface = require('cmnd').CommandLineInterface;
const CLI = new CommandLineInterface();

CLI.load(__dirname, './commands');

module.exports = CLI;
