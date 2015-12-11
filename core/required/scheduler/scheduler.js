module.exports = (function() {

  'use strict';

  const SchedulerTask = require('./task.js');

  class SchedulerEntry {

    constructor(scheduler) {

      this._scheduler = scheduler;
      this._task = null;
      this.timeouts = [];
      this.intervals = [];

      this.minInterval = null;
      this.timeLength = null;

    }

    getDateOffset(cur) {

      return cur;

    }

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

    perform(Task) {

      if (!SchedulerTask.prototype.isPrototypeOf(Task.prototype)) {
        throw new Error('SchedulerEntry#perform must be provided with a valid SchedulerTask.');
      }

      this._task = new Task();

    }

    exec() {

      this._task && this._task.exec(this._scheduler._app, () => {});

    }

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

    stop() {

      this.timeouts.forEach(clearTimeout);
      this.intervals.forEach(clearInterval);

    }

  }

  class MinutelyEntry extends SchedulerEntry {

    constructor(scheduler, times) {

      super(scheduler);

      this.minInterval = 1;
      this.timeLength = 60;

      this.__initialize__(times);

    }

    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate(), cur.getUTCHours(), cur.getUTCMinutes()));

    }

  }

  class HourlyEntry extends SchedulerEntry {

    constructor(scheduler, times) {

      super(scheduler);

      this.minInterval = 60;
      this.timeLength = 60 * 60;

      this.__initialize__(times);

    }

    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate(), cur.getUTCHours()));

    }

  }

  class DailyEntry extends SchedulerEntry {

    constructor(scheduler, times) {

      super(scheduler);

      this.minInterval = 60 * 60;
      this.timeLength = 60 * 60 * 24;

      this.__initialize__(times);

    }

    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));

    }

  }

  class WeeklyEntry extends SchedulerEntry {

    constructor(scheduler, times) {

      super(scheduler);

      this.minInterval = 60 * 60 * 24;
      this.timeLength = 60 * 60 * 24 * 7;

      this.__initialize__(times);

    }

    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() - cur.getUTCDay()));

    }

  }

  class Scheduler {

    constructor() {

      this._app = null;
      this.entries = [];

    }

    _entry(entryConstructor, args) {

      let times = [].slice.call(args);
      let entry = new entryConstructor(this, times);
      this.entries.push(entry);
      return entry;

    }

    setApp(app) {

      this._app = app;
      return true;

    }

    minutely() {

      return this._entry(MinutelyEntry, arguments);

    }

    hourly() {

      return this._entry(HourlyEntry, arguments);

    }

    daily() {

      return this._entry(DailyEntry, arguments);

    }

    weekly() {

      return this._entry(WeeklyEntry, arguments);

    }

    start() {

      this.entries.forEach(function(v) {

        v.start();

      });

      return this;

    }

    stop() {

      this.entries.forEach(function(v) {

        v.stop();

      });

      return this;

    }

    restart() {

      this.stop();
      return this.start();

    }

  }

  return Scheduler;

})();
