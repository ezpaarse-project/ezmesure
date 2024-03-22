// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const UsersService = require('../../entities/users.service');
const { syncUser } = require('../../services/sync/elastic');

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Membership} Membership
 */

/**
 * Synchronize the Elasticsearch user associated to a membership
 * @param {Membership} membership - The membership that was changed
 * @returns {Promise<void>}
 */
const onMembershipChange = async (membership) => {
  const usersService = new UsersService();
  const user = await usersService.findUnique({
    where: {
      username: membership.username,
    },
  });

  if (user) {
    try {
      await syncUser(user);
      appLogger.verbose(`[memberships][hooks] Roles of user [${user?.username}] have been updated`);
    } catch (error) {
      appLogger.error(`[memberships][hooks] Roles of user [${user?.username}] could not be updated:\n${error}`);
    }
  }
};

registerHook('membership:create', onMembershipChange);
registerHook('membership:update', onMembershipChange);
registerHook('membership:upsert', onMembershipChange);
registerHook('membership:delete', onMembershipChange);
