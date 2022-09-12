const { CronJob } = require('cron');
const { getMetric } = require('./metrics');

const job = new CronJob({
  cronTime: '0 0 0 * * *',
  onTick: getMetric(),
  runOnInit: true,
});

module.exports = job;
