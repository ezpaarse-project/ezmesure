// @ts-check

const config = require('config');
const { CronJob } = require('cron');
const ezrAxios = require('../ezreeport/axios');
const reportingUsers = require('../ezreeport/reportingUsers');

const { appLogger } = require('../logger');

const institutionsService = require('../../entities/institutions.service');
const usersService = require('../../entities/users.service');

const { syncSchedule } = config.get('ezreeport');

/**
 * @typedef {import('../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {{ created: number, updated: number, deleted: number }} EzrSyncCounts
 */

/**
 * @template {string} T
 * @typedef {ThrottledPromisesResult & { [K in T]: EzrSyncCounts }} EzrSyncResult
 */

/**
 * Sync ezREEPORT's users with current users
 * @returns {Promise<EzrSyncResult<'users'>>}
 */
async function syncUsers() {
  const users = await usersService.findMany({});

  appLogger.verbose(`[ezreeport] Synchronizing ${users?.length} users`);

  const { data } = await ezrAxios.put('/admin/users', users.map((u) => ({
    isAdmin: u.isAdmin,
    username: u.username,
  })));

  const results = data?.content?.users?.reduce?.((acc, user) => {
    const counts = acc;
    counts[user?.type] += 1;
    return counts;
  }, { created: 0, updated: 0, deleted: 0 });

  appLogger.info(`[ezreeport] ${data?.meta?.users ?? -1} Users synchronized`);
  appLogger.verbose(`[ezreeport] ${results?.created} users created`);
  appLogger.verbose(`[ezreeport] ${results?.updated} users updated`);
  appLogger.verbose(`[ezreeport] ${results?.deleted} users deleted`);

  return {
    fulfilled: data?.meta?.users ?? -1,
    errors: 0,

    users: results,
  };
}

/**
 * Sync ezREEPORT's namespaces with current institutions
 * @returns {Promise<EzrSyncResult<'namespaces' | 'memberships'>>}
 */
async function syncNamespaces() {
  const institutions = await institutionsService.findMany({
    include: { memberships: true },
    where: { validated: true },
  });

  appLogger.verbose(`[ezreeport] Synchronizing ${institutions?.length} namespaces`);

  const namespaces = institutions.map((i) => ({
    id: i.id,
    name: i.name,
    logoId: i.logoId || undefined,
    fetchLogin: { elastic: { username: reportingUsers.getReportUserFromInstitution(i).username } },
    fetchOptions: { elastic: {} },
    members: i?.memberships
      // Only keeping users which have access to reporting
      .filter((m) => m.permissions.some((p) => /^reporting:/.test(p)))
      .map((m) => ({
        access: m.permissions.some((p) => p === 'reporting:write') ? 'READ_WRITE' : 'READ',
        username: m.username,
      })),
  }));

  const { data } = await ezrAxios.put('/admin/namespaces', namespaces);

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

  appLogger.info(`[ezreeport] ${data?.meta?.namespaces ?? -1} Namespaces synchronized`);
  appLogger.verbose(`[ezreeport] ${namespacesResults?.created} namespaces created`);
  appLogger.verbose(`[ezreeport] ${namespacesResults?.updated} namespaces updated`);
  appLogger.verbose(`[ezreeport] ${namespacesResults?.deleted} namespaces deleted`);

  appLogger.info(`[ezreeport] ${data?.meta?.members ?? -1} Memberships synchronized`);
  appLogger.verbose(`[ezreeport] ${membershipsResults?.created} memberships created`);
  appLogger.verbose(`[ezreeport] ${membershipsResults?.updated} memberships updated`);
  appLogger.verbose(`[ezreeport] ${membershipsResults?.deleted} memberships deleted`);

  reportingUsers.syncReportUsersFromInstitutions(
    institutions,
    data?.content?.namespaces?.map((n) => (n.type === 'deleted' ? n.data : undefined)) ?? [],
  )
    .then((results) => {
      appLogger.info(`[ezreeport] ${results.upserted} Reporting users synchronized`);
      appLogger.verbose(`[ezreeport] ${results.upserted} reporting users upserted`);
      appLogger.verbose(`[ezreeport] ${results.deleted} reporting users deleted`);
    })
    .catch((err) => {
      appLogger.info(`[ezreeport] Cannot synchronize reporting users: ${err}`);
    });

  return {
    fulfilled: data?.meta?.namespaces ?? -1,
    errors: 0,

    namespaces: namespacesResults,
    memberships: membershipsResults,
  };
}

async function sync() {
  await syncUsers();
  await syncNamespaces();
}

async function startCron() {
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
  syncUsers,
  syncNamespaces,
  startCron,
  sync,
};
