// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const usersService = require('../../entities/users.service');
const { syncUser } = require('../../services/sync/elastic');

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Membership} Membership
 */

/**
 * Update roles of the Elasticsearch user
 * @param {User} user
 * @returns {Promise<void>}
 */
const syncUserRoles = async (user) => {
  try {
    await syncUser(user);
    appLogger.verbose(`[memberships][hooks] Roles of user [${user?.username}] have been updated`);
  } catch (error) {
    appLogger.error(`[memberships][hooks] Roles of user [${user?.username}] could not be updated:\n${error}`);
  }
};

/**
 *
 * @param {Membership} membership - The membership that was changed
 * @returns {Promise<void>}
 */
const onMembershipChange = async (membership) => {
  const user = await usersService.findUnique({
    where: {
      username: membership.username,
    },
  });

  if (user) {
    syncUserRoles(user);
  }
};

const onRepositoryChange = async (repository) => {
  const users = await usersService.findMany({
    where: {
      memberships: {
        some: {
          repositoryPermissions: {
            some: { repositoryPattern: repository.pattern },
          },
        },
      },
    },
  });

  await Promise.allSettled(users.map(syncUserRoles));
  appLogger.verbose(`[memberships][hooks] Updated roles of ${users.length} users after change in repository [${repository.pattern}]`);
};

const onSpaceChange = async (space) => {
  const users = await usersService.findMany({
    where: {
      memberships: {
        some: {
          spacePermissions: {
            some: { spaceId: space.id },
          },
        },
      },
    },
  });

  await Promise.allSettled(users.map(syncUserRoles));
  appLogger.verbose(`[memberships][hooks] Updated roles of ${users.length} users after change in space [${space.id}]`);
};

registerHook('membership:create', onMembershipChange);
registerHook('membership:update', onMembershipChange);
registerHook('membership:upsert', onMembershipChange);
registerHook('membership:delete', onMembershipChange);
