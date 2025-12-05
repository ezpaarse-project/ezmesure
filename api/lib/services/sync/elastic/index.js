// @ts-check
const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../../logger');

const {
  syncRepositories,
  syncRepository,
  unmountRepository,
  syncRepositoryIndexTemplates,
} = require('./repositories');
const { syncRepositoryAlias, syncRepositoryAliases, unmountAlias } = require('./alias');
const { syncUser, syncUsers } = require('./users');
const { syncApiKey, syncApiKeys } = require('./api-keys');

const { syncSchedule } = config.get('elasticsearch');

const sync = async () => {
  await syncRepositories();
  await syncRepositoryAliases();
  await syncUsers();
  await syncApiKeys();
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
  syncRepositoryIndexTemplates,
  syncUser,
  syncUsers,
  syncApiKey,
  syncApiKeys,
};
