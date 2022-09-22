const { CronJob } = require('cron');
const { getMetrics } = require('./metrics');

const job = new CronJob({
  cronTime: '0 0 0 * * *',
  onTick: getMetrics,
  runOnInit: true,
});

module.exports = job;
