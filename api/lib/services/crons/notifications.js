// @ts-check
const { CronJob } = require('cron');
const config = require('config');

const { appLogger } = require('../logger');
const { sendNotifications } = require('../notifications');

const { recipients, cron } = config.get('notifications');

const startBroadcastCron = () => {
  const job = new CronJob(cron, () => {
    sendNotifications().catch((err) => {
      appLogger.error(`Failed to broadcast recent activity : ${err}`);
    });
  });

  if (recipients) {
    job.start();
  } else {
    appLogger.warn('No recipient configured, notifications will be disabled');
  }
};

module.exports = {
  startBroadcastCron,
};
