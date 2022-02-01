const { CronJob } = require('cron');
const { getMetric } = require('./metrics');
const logger = require('../../services/logger');

const job = new CronJob({
  cronTime: '0 0 0 * * *',
  getMetric,
  runOnInit: true,
});

exports.start = () => {
  logger.info('Cache is running (metrics)');
  job.start();
};
