// @ts-check
const config = require('config');
const { CronJob } = require('cron');

const { appLogger } = require('../../logger');
const { syncUsers, syncNamespaces } = require('../../sync/ezreeport');

const { syncSchedule } = config.get('ezreeport');

async function sync() {
  await syncUsers();
  await syncNamespaces();
}

async function startSyncCron() {
  const job = CronJob.from({
    cronTime: syncSchedule,
    runOnInit: false,
    onTick: async () => {
      appLogger.verbose('[ezreeport] Starting synchronization');
      try {
        await sync();
        appLogger.info('[ezreeport] Synchronized');
      } catch (e) {
        const message = e?.response?.data?.content?.message || e.message;
        appLogger.error(`[ezreeport] Failed to synchronize: ${message}`);
      }
    },
  });

  job.start();
}

module.exports = {
  startSyncCron,
};
