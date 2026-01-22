// @ts-check
const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../../logger');

const { syncSchedule } = config.get('elasticsearch');

const { syncRepositories } = require('../../sync/elastic/repositories');
const { syncRepositoryAliases } = require('../../sync/elastic/alias');
const { syncUsers } = require('../../sync/elastic/users');

const sync = async () => {
  await syncRepositories();
  await syncRepositoryAliases();
  await syncUsers();
};

/**
 * Start cron to periodically sync Elastic to ezMESURE
 */
const startSyncCron = async () => {
  const job = CronJob.from({
    cronTime: syncSchedule,
    runOnInit: false,
    onTick: async () => {
      appLogger.verbose('[elastic] Starting synchronization');
      try {
        await sync();
        appLogger.info('[elastic] Synchronized');
      } catch (e) {
        const message = e?.response?.data?.content?.message || e.message;
        appLogger.error(`[elastic] Failed to synchronize: ${message}`);
      }
    },
  });

  job.start();
};

module.exports = {
  startSyncCron,
};
