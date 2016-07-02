'use strict';

const Nodal = require('nodal');
const scheduler = new Nodal.Scheduler();

/* generator: begin imports */

const DummyTask = Nodal.require('tasks/dummy_task.js');

/* generator: end imports */

/* generator: begin tasks */

scheduler.minutely(30).perform(DummyTask);

/* generator: end tasks */


module.exports = scheduler;
