module.exports = (function() {

  'use strict';

  /**
  * Base entry for schedulers for performing repeated tasks.
  * @class
  */
  class SchedulerEntry {

    /**
    * @param {Nodal.Scheduler} scheduler The scheduler instance this entry belongs to
    */
    constructor(scheduler) {

      this._scheduler = scheduler;
      this._task = null;
      this.timeouts = [];
      this.intervals = [];

      this.minInterval = null;
      this.timeLength = null;

    }

    /**
    * Get the difference between now and the last time the task should be executed. Overwritten when inherited.
    * @param {Date} cur The current Date object
    */
    getDateOffset(cur) {

      return cur;

    }

    /**
    * Initialize the entry.
    * @private
    * @param {Array} times The times at which this entry should execute
    */
    __initialize__(times) {

      let timeLength = this.timeLength;
      let minInterval = this.minInterval;

      this.times = times.filter(function(v) {

        return typeof(v) === 'number';

      }).map(function(v) {

        return Math.min(Math.max(0, parseFloat(v) || 0), timeLength) * 1000 * minInterval;

      }).filter(function(v, i, arr) {

        return arr.indexOf(v) === i;

      });

    }

    /**
    * Assign a task to this scheduler entry
    * @param {Nodal.Task|constructor} task The Task to perform (must have an exec function)
    */
    perform(Task) {

      this._task = new Task();

    }

    /**
    * Execute the scheduler entry's associated task
    */
    exec() {

      this._task && this._task.exec(this._scheduler._app, null, () => {});

    }

    /**
    * Begin the scheduler entry. Create a timeout for the first execution, and an interval for all subsequent ones.
    */
    start() {

      let intervals = [];

      let name = this.constructor.name;

      let timeouts = this.times.map(v => {

        let cur = new Date();
        let start = this.getDateOffset(cur);
        let offset = (start.valueOf() + v) - cur.valueOf();
        offset = offset < 0 ? (1000 * this.timeLength) + offset : offset;

        console.log(`${this._task.constructor.name} will execute in ${Math.round(offset/1000)} seconds`);

        return setTimeout(() => {
          this.exec();
          intervals.push(setInterval(this.exec.bind(this), 1000 * this.timeLength));
        }, offset);

      });

      this.interval = intervals;
      this.timeouts = timeouts;

    }

    /**
    * Clear all timeouts and intervals for the scheduler entry (stops it).
    */
    stop() {

      this.timeouts.forEach(clearTimeout);
      this.intervals.forEach(clearInterval);

    }

  }

  /**
  * SchedulerEntry extension for minutely (on the second) execution
  * @class
  */
  class MinutelyEntry extends SchedulerEntry {

    /**
    * @param {Nodal.Scheduler} scheduler the scheduler the entry belongs to
    * @param {Array} times The times (in seconds) to execute the task
    */
    constructor(scheduler, times) {

      super(scheduler);

      this.minInterval = 1;
      this.timeLength = 60;

      this.__initialize__(times);

    }

    /**
    * Sets the offset to the nearest minute
    * @param {Date} cur The current Date
    */
    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate(), cur.getUTCHours(), cur.getUTCMinutes()));

    }

  }

  /**
  * SchedulerEntry extension for hourly (on the minute) execution
  * @class
  */
  class HourlyEntry extends SchedulerEntry {

    /**
    * @param {Nodal.Scheduler} scheduler the scheduler the entry belongs to
    * @param {Array} times The times (in minutes) to execute the task
    */
    constructor(scheduler, times) {

      super(scheduler);

      this.minInterval = 60;
      this.timeLength = 60 * 60;

      this.__initialize__(times);

    }

    /**
    * Sets the offset to the nearest hour
    * @param {Date} cur The current Date
    */
    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate(), cur.getUTCHours()));

    }

  }

  /**
  * SchedulerEntry extension for daily (on the hour) execution
  * @class
  */
  class DailyEntry extends SchedulerEntry {

    /**
    * @param {Nodal.Scheduler} scheduler the scheduler the entry belongs to
    * @param {Array} times The times (in hours) to execute the task
    */
    constructor(scheduler, times) {

      super(scheduler);

      this.minInterval = 60 * 60;
      this.timeLength = 60 * 60 * 24;

      this.__initialize__(times);

    }

    /**
    * Sets the offset to the nearest day
    * @param {Date} cur The current Date
    */
    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));

    }

  }

  /**
  * SchedulerEntry extension for weekly (on the day of week) execution
  * @class
  */
  class WeeklyEntry extends SchedulerEntry {

    /**
    * @param {Nodal.Scheduler} scheduler the scheduler the entry belongs to
    * @param {Array} times The times (in days of week) to execute the task
    */
    constructor(scheduler, times) {

      super(scheduler);

      this.minInterval = 60 * 60 * 24;
      this.timeLength = 60 * 60 * 24 * 7;

      this.__initialize__(times);

    }

    /**
    * Sets the offset to the nearest week
    * @param {Date} cur The current Date
    */
    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() - cur.getUTCDay()));

    }

  }

  /**
  * Use to delegate tasks minutely, hourly, daily, or weekly.
  * @class
  */
  class Scheduler {

    constructor() {

      this._app = null;
      this.entries = [];

    }

    /**
    * Create a SchedulerEntry object given arguments (times)
    * @param {Nodal.SchedulerEntry} entryConstructor The entry to create
    * @param {Array} args The arguments to initialize Scheduler Entry with
    * @private
    */
    _entry(entryConstructor, args) {

      let times = [].slice.call(args);
      let entry = new entryConstructor(this, times);
      this.entries.push(entry);
      return entry;

    }

    /**
    * Set the app for the scheduler.
    * @param {Nodal.Application} app Your Nodal application
    */
    setApp(app) {

      this._app = app;
      return true;

    }

    /**
    * Construct a new Nodal.MinutelyEntry. All arguments passed represent the times to execute.
    */
    minutely() {

      return this._entry(MinutelyEntry, arguments);

    }

    /**
    * Construct a new Nodal.HourlyEntry. All arguments passed represent the times to execute.
    */
    hourly() {

      return this._entry(HourlyEntry, arguments);

    }

    /**
    * Construct a new Nodal.DailyEntry. All arguments passed represent the times to execute.
    */
    daily() {

      return this._entry(DailyEntry, arguments);

    }

    /**
    * Construct a new Nodal.WeeklyEntry. All arguments passed represent the times to execute.
    */
    weekly() {

      return this._entry(WeeklyEntry, arguments);

    }

    /**
    * Starts all associated SchedulerEntry objects for the Scheduler
    */
    start() {

      this.entries.forEach(function(v) {

        v.start();

      });

      return this;

    }

    /**
    * Stops all associated SchedulerEntry objects for the Scheduler
    */
    stop() {

      this.entries.forEach(function(v) {

        v.stop();

      });

      return this;

    }

    /**
    * Restarts all associated SchedulerEntry objects for the Scheduler
    */
    restart() {

      this.stop();
      return this.start();

    }

  }

  return Scheduler;

})();
