// @ts-check
const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../../logger');

const {
  syncRepositories,
  syncRepository,
  unmountRepository,
  syncRepositoryIndexTemplate,
} = require('./repositories');
const { syncRepositoryAlias, syncRepositoryAliases, unmountAlias } = require('./alias');
const { syncUser, syncUsers } = require('./users');

const { syncSchedule } = config.get('elasticsearch');

const sync = async () => {
  await syncRepositories();
  await syncRepositoryAliases();
  await syncUsers();
};

/**
 * Start cron to periodically sync Elastic to ezMESURE
 */
const startCron = async () => {
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
  startCron,
  sync,
  syncRepository,
  unmountRepository,
  syncRepositories,
  syncRepositoryAlias,
  unmountAlias,
  syncRepositoryAliases,
  syncRepositoryIndexTemplate,
  syncUser,
  syncUsers,
};
