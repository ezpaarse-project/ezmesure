const { CronJob } = require('cron');

const { getMetrics } = require('../metrics');

const job = CronJob.from({
  cronTime: '0 0 0 * * *',
  onTick: () => getMetrics(true),
  runOnInit: true,
});

module.exports = job;
