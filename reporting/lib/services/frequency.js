const {
  startOfMinute,
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  startOfQuarter,
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addQuarters,
  getMonth,
  setMonth,
} = require('date-fns');

const startFunctions = new Map([
  ['m', startOfMinute],
  ['h', startOfHour],
  ['d', startOfDay],
  ['w', (date) => startOfWeek(date, { weekStartsOn: 1 })],
  ['M', startOfMonth],
  ['y', startOfYear],
  ['quarterly', startOfQuarter],
  ['semiannual', (date) => (getMonth(date) < 5 ? startOfYear(date) : startOfMonth(setMonth(date, 5)))],
]);

const addFunctions = new Map([
  ['m', addMinutes],
  ['h', addHours],
  ['d', addDays],
  ['w', addWeeks],
  ['M', addMonths],
  ['y', addYears],
  ['quarterly', addQuarters],
  ['semiannual', function addSemesters(date, nb) { return addQuarters(date, nb * 2); }],
]);

class Frequency {
  constructor(str) {
    const match = /^([0-9]+)?([mhdwMy]|quarterly|semiannual)$/.exec(str);

    if (match) {
      this.valid = true;
      this.count = Number.parseInt(match[1] || 1, 10);
      this.unit = match[2]; // eslint-disable-line prefer-destructuring
    } else {
      this.valid = false;
    }
  }

  isValid() {
    return this.valid;
  }

  startOfnextPeriod(date) {
    return startFunctions.get(this.unit)(addFunctions.get(this.unit)(date, this.count));
  }

  startOfCurrentPeriod(date) {
    return startFunctions.get(this.unit)(date);
  }

  startOfPreviousPeriod(date) {
    return startFunctions.get(this.unit)(addFunctions.get(this.unit)(date, this.count * -1));
  }
}

module.exports = Frequency;
