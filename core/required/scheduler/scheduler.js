module.exports = (function() {

  'use strict';

  const SchedulerTask = require('./task.js');

  class SchedulerEntry {

    constructor() {

      this._task = null;
      this.timeouts = [];
      this.intervals = [];

      this.minInterval = null;
      this.timeLength = null;

    }

    getDateOffset(cur) {

      return cur;

    }

    __init__(times) {

      let timeLength = this.timeLength;
      let minInterval = this.minInterval;

      this.times = times.filter(function(v) {

        return !!parseInt(v);

      }).map(function(v) {

        return Math.min(Math.max(0, parseInt(v)), timeLength) * 1000 * minInterval;

      });

    }

    perform(Task) {

      if (!SchedulerTask.prototype.isPrototypeOf(Task.prototype)) {
        throw new Error('SchedulerEntry#perform must be provided with a valid SchedulerTask.');
      }

      this._task = new Task();

    }

    exec() {

      this._task && this._task.exec();

    }

    start() {

      let timeLength = this.timeLength;
      let exec = this.exec.bind(this);
      let getDateOffset = this.getDateOffset.bind(this);
      let intervals = [];

      let timeouts = this.times.map(function(v) {

        let cur = new Date();
        let start = getDateOffset(cur);
        let offset = (start.valueOf() + v) - cur.valueOf();
        offset = offset < 0 ? 1000 * timeLength + offset : offset;

        return setTimeout(function() {
          exec();
          intervals.push(setInterval(exec, 1000 * timeLength));
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

    constructor(times) {

      super();

      this.minInterval = 1;
      this.timeLength = 60;

      this.__init__(times);

    }

    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate(), cur.getUTCHours(), cur.getUTCMinutes()));

    }

  }

  class HourlyEntry extends SchedulerEntry {

    constructor(times) {

      super();

      this.minInterval = 60;
      this.timeLength = 60 * 60;

      this.__init__(times);

    }

    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate(), cur.getUTCHours()));

    }

  }

  class DailyEntry extends SchedulerEntry {

    constructor(times) {

      super();

      this.minInterval = 60 * 60;
      this.timeLength = 60 * 60 * 24;

      this.__init__(times);

    }

    getDateOffset(cur) {

      return new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));

    }

  }

  class Scheduler {

    constructor() {

      this.entries = [];
      this.__initialize__();
      this.start();

    }

    __initialize__() {}

    _entry(entryConstructor, args) {

      let times = [].slice.call(args);
      let entry = new entryConstructor(times);
      this.entries.push(entry);
      return entry;

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
