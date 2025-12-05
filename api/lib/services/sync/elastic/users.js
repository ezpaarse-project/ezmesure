// @ts-check
const { appLogger } = require('../../logger');

const UsersService = require('../../../entities/users.service');

const { generateUserRoles } = require('../../../hooks/utils');
const { execThrottledPromises } = require('../../promises');

const { upsertUser } = require('../../elastic/users');

/**
 * @typedef {import('../../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('../../../.prisma/client.mjs').User} User
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityUser} ElasticUser
 */

/**
 * Sync an Elasticsearch user with a given membership
 * @param {User} user - The user to synchronize
 */
const syncUser = async (user) => {
  const roles = await generateUserRoles(user.username);

  await upsertUser({
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    roles,
    metadata: {},
  });
};

/**
 * Sync Elastic's users' roles to ezMESURE's memberships
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncUsers = async () => {
  const usersService = new UsersService();
  const users = await usersService.findMany({});

  const executors = users.map(
    (user) => async () => syncUser(user),
  );

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting roles for users: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted roles for ${res.fulfilled} users (${res.errors} errors)`);
  return res;
};

module.exports = {
  syncUser,
  syncUsers,
};
