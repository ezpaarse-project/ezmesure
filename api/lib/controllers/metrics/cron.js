const { CronJob } = require('cron');
const { getMetric } = require('./metrics');

const cronMetrics = new CronJob('0 0 0 * * *', async () => {
  await getMetric();
}, null, true, 'Europe/Paris');

module.exports = cronMetrics;
