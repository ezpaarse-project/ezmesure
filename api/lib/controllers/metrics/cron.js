const { CronJob } = require('cron');
const { getMetric } = require('./metrics');
const { appLogger } = require('../../services/logger');

const job = new CronJob({
  cronTime: '0 0 0 * * *',
  getMetric,
  runOnInit: true,
});

exports.start = () => {
  appLogger.info('Cache is running (metrics)');
  job.start();
};
