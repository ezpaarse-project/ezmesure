// @ts-check

const config = require('config');
const { CronJob } = require('cron');
const ezrAxios = require('../ezreeport/axios');
const reportingUsers = require('../ezreeport/reportingUsers');

const { appLogger } = require('../logger');

const InstitutionsService = require('../../entities/institutions.service');
const UsersService = require('../../entities/users.service');

const { syncSchedule } = config.get('ezreeport');

/**
 * @typedef {import('../../.prisma/client').Institution} Institution
 * @typedef {import('../../.prisma/client').Membership} Membership
 */

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
  const usersService = new UsersService();
  const users = await usersService.findMany({
    select: {
      username: true,
      isAdmin: true,
    },
  });

  appLogger.verbose(`[ezreeport] Synchronizing ${users?.length} users`);

  const { data } = await ezrAxios.put('/admin/users', users.map((u) => ({
    isAdmin: u.isAdmin,
    username: u.username,
  })));
  const { users: userResult } = data?.content ?? {};

  if (!userResult) {
    throw new Error("Couldn't synchronize users");
  }

  const total = userResult.created + userResult.updated;
  appLogger.info(`[ezreeport] ${total} Users synchronized`);
  appLogger.verbose(`[ezreeport] ${userResult.created} users created`);
  appLogger.verbose(`[ezreeport] ${userResult.updated} users updated`);
  appLogger.verbose(`[ezreeport] ${userResult.deleted} users deleted`);

  return {
    fulfilled: total,
    errors: 0,

    users: userResult,
  };
}

/**
 * Sync ezREEPORT's namespaces with current institutions
 * @returns {Promise<EzrSyncResult<'namespaces' | 'memberships'>>}
 */
async function syncNamespaces() {
  const institutionsService = new InstitutionsService();
  /** @type {(Institution & { memberships: Membership[] })[]} */
  // @ts-ignore
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
    memberships: i?.memberships
      // Only keeping users which have access to reporting
      .filter((m) => m.permissions.some((p) => /^reporting:/.test(p)))
      .map((m) => ({
        access: m.permissions.some((p) => p === 'reporting:write') ? 'READ_WRITE' : 'READ',
        username: m.username,
      })),
  }));

  const { data } = await ezrAxios.put('/admin/namespaces', namespaces);
  const { namespaces: namespaceResult, memberships: membershipResult } = data?.content ?? {};

  if (!namespaceResult) {
    throw new Error("Couldn't synchronize namespaces");
  }

  const namespaceTotal = namespaceResult.created + namespaceResult.updated;
  appLogger.info(`[ezreeport] ${namespaceTotal} Namespaces synchronized`);
  appLogger.verbose(`[ezreeport] ${namespaceResult.created} namespaces created`);
  appLogger.verbose(`[ezreeport] ${namespaceResult.updated} namespaces updated`);
  appLogger.verbose(`[ezreeport] ${namespaceResult.deleted} namespaces deleted`);

  if (!membershipResult) {
    throw new Error("Couldn't synchronize memberships");
  }

  const membershipTotal = membershipResult.created + membershipResult.updated;
  appLogger.info(`[ezreeport] ${membershipTotal} Memberships synchronized`);
  appLogger.verbose(`[ezreeport] ${membershipResult.created} memberships created`);
  appLogger.verbose(`[ezreeport] ${membershipResult.updated} memberships updated`);
  appLogger.verbose(`[ezreeport] ${membershipResult.deleted} memberships deleted`);

  reportingUsers.syncReportUsersFromInstitutions(institutions)
    .then((results) => {
      appLogger.info(`[ezreeport] ${results.upserted} Reporting users synchronized`);
      appLogger.verbose(`[ezreeport] ${results.upserted} reporting users upserted`);
      appLogger.verbose(`[ezreeport] ${results.deleted} reporting users deleted`);
    })
    .catch((err) => {
      appLogger.info(`[ezreeport] Cannot synchronize reporting users: ${err}`);
    });

  return {
    fulfilled: namespaceTotal,
    errors: 0,

    namespaces: namespaceResult,
    memberships: membershipResult,
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
