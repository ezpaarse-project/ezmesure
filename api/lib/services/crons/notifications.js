// @ts-check
const { CronJob } = require('cron');
const config = require('config');

const { appLogger } = require('../logger');
const { sendNotifications } = require('../notifications');

const { cron } = config.get('notifications');

const startBroadcastCron = () => {
  const job = CronJob.from({
    cronTime: cron,
    runOnInit: false,
    onTick: async () => {
      try {
        sendNotifications();
      } catch (err) {
        appLogger.error(`Failed to broadcast recent activity : ${err}`);
      }
    },
  });

  job.start();
};

module.exports = {
  startBroadcastCron,
};
