const config = require('config');
const { CronJob } = require('cron');
const ezrAxios = require('./axios');

const { appLogger } = require('../logger');

const institutionsService = require('../../entities/institutions.service');
const usersService = require('../../entities/users.service');

const { syncSchedule } = config.get('ezreeport');

/**
 * Sync ezREEPORT's users with current users
 */
async function syncUsers() {
  const { data: users } = await usersService.findMany();

  appLogger.verbose(`[ezReeport] Synchronizing ${users?.length} users`);

  const { data } = await ezrAxios.put('/admin/users', users.map((u) => ({
    isAdmin: u.isAdmin,
    username: u.username,
  })));

  const results = data?.content?.users?.reduce?.((acc, user) => {
    const counts = acc;
    counts[user?.type] += 1;
    return counts;
  }, { created: 0, updated: 0, deleted: 0 });

  appLogger.info('[ezReeport] Users synchronized');
  appLogger.verbose(`[ezReeport] ${results?.created} users created`);
  appLogger.verbose(`[ezReeport] ${results?.updated} users updated`);
  appLogger.verbose(`[ezReeport] ${results?.deleted} users deleted`);
}

/**
 * Sync ezREEPORT's namespaces with current institutions
 */
async function syncNamespaces() {
  const { data: institutions } = await institutionsService.findMany({
    include: { memberships: true },
    where: { validated: true },
  });

  appLogger.verbose(`[ezReeport] Synchronizing ${institutions?.length} namespaces`);

  const { data } = await ezrAxios.put('/admin/namespaces', institutions.map((i) => ({
    id: i.id,
    name: i.name,
    logoId: i.logoId || undefined,
    fetchLogin: {},
    fetchOptions: {},
    members: i?.memberships.map((m) => ({
      access: 'READ_WRITE',
      username: m.username,
    })),
  })));

  const namespacesResults = data?.content?.namespaces?.reduce?.((acc, namespace) => {
    const counts = acc;
    counts[namespace?.type] += 1;
    return counts;
  }, { created: 0, updated: 0, deleted: 0 });

  const membershipsResults = data?.content?.members?.reduce?.((acc, membership) => {
    const counts = acc;
    counts[membership?.type] += 1;
    return counts;
  }, { created: 0, updated: 0, deleted: 0 });

  appLogger.info('[ezReeport] Namespaces synchronized');
  appLogger.verbose(`[ezReeport] ${namespacesResults?.created} namespaces created`);
  appLogger.verbose(`[ezReeport] ${namespacesResults?.updated} namespaces updated`);
  appLogger.verbose(`[ezReeport] ${namespacesResults?.deleted} namespaces deleted`);
  appLogger.verbose(`[ezReeport] ${membershipsResults?.created} memberships created`);
  appLogger.verbose(`[ezReeport] ${membershipsResults?.updated} memberships updated`);
  appLogger.verbose(`[ezReeport] ${membershipsResults?.deleted} memberships deleted`);
}

async function sync() {
  await syncUsers();
  await syncNamespaces();
}

async function startCron() {
  const job = new CronJob({
    cronTime: syncSchedule,
    runOnInit: true,
    onTick: async () => {
      appLogger.verbose('[ezReeport] Starting synchronization');
      try {
        await sync();
        appLogger.info('[ezReeport] Synchronized');
      } catch (e) {
        const message = e?.response?.data?.content?.message || e.message;
        appLogger.error(`[ezReeport] Failed to synchronize: ${message}`);
      }
    },
  });

  job.start();
}

module.exports = {
  startCron,
  sync,
};
