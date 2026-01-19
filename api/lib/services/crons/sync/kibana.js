// @ts-check
const config = require('config');
const { CronJob } = require('cron');

const { appLogger } = require('../../logger');
const { syncSpaces, syncCustomRoles } = require('../../sync/kibana');

const { syncSchedule } = config.get('kibana');

const sync = async () => {
  await syncSpaces();
  await syncCustomRoles();
};

/**
 * Start cron to periodically sync Kibana to ezMESURE
 */
const startSyncCron = async () => {
  const job = CronJob.from({
    cronTime: syncSchedule,
    runOnInit: true,
    onTick: async () => {
      appLogger.verbose('[kibana] Starting synchronization');
      try {
        await sync();
        appLogger.info('[kibana] Synchronized');
      } catch (e) {
        const message = e?.response?.data?.content?.message || e.message;
        appLogger.error(`[kibana] Failed to synchronize: ${message}`);
      }
    },
  });

  job.start();
};

module.exports = {
  startSyncCron,
};
