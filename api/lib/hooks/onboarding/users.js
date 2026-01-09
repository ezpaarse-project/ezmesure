// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { client: prisma } = require('../../services/prisma');
const { syncUser: syncElasticUser } = require('../../services/sync/elastic');
const { upsertFromUser: syncEzrUser } = require('../../services/ezreeport/users');

const { FEATURES } = require('../../entities/memberships.dto');

const { EVENT_TYPES } = require('../../utils/notifications/constants');

/**
 * @typedef {import('../../.prisma/client.mjs').User} User
 */

/**
 * Add user to onboarding institutions
 *
 * @param {User} user - The user that was created
 */
const onboardUser = async (user) => {
  // Get onboarding institutions
  const onboardingInstitutions = await prisma.institution.findMany({
    where: { onboarding: true },
    select: {
      id: true,
      spaces: { select: { id: true } },
      repositories: { select: { pattern: true } },
      repositoryAliases: { select: { pattern: true } },
    },
  });

  if (onboardingInstitutions.length === 0) {
    return;
  }

  // Get onboarding roles
  const onboardingRoles = await prisma.role.findMany({
    select: { id: true },
    where: {
      autoAssign: { has: EVENT_TYPES.joinOnboardingInstitution },
    },
  });

  const permissions = Object.values(FEATURES).map((perm) => perm.read);

  // Using prisma instead of service to avoid loops between hooks
  await prisma.$transaction(onboardingInstitutions.map(
    (institution) => prisma.membership.create({
      data: {
        user: { connect: { username: user.username } },
        institution: { connect: { id: institution.id } },
        locked: false,
        permissions,

        roles: {
          createMany: {
            data: onboardingRoles.map((role) => ({ roleId: role.id })),
          },
        },

        spacePermissions: {
          createMany: {
            data: institution.spaces.map((space) => ({
              spaceId: space.id,
              locked: false,
              readonly: true,
            })),
          },
        },

        repositoryPermissions: {
          createMany: {
            data: institution.repositories.map((repository) => ({
              repositoryPattern: repository.pattern,
              locked: false,
              readonly: true,
            })),
          },
        },

        repositoryAliasPermissions: {
          createMany: {
            data: institution.repositoryAliases.map((alias) => ({
              aliasPattern: alias.pattern,
              locked: false,
            })),
          },
        },
      },
    }),
  ));
};

/**
 * Create a full readonly membership for every onboarding institution
 *
 * @param {User} user - The user that was created
 */
const onUserUpsert = async (user) => {
  // If updatedAt and createdAt are the same, we just created the account
  if (user.createdAt.getTime() !== user.updatedAt.getTime()) {
    return;
  }

  try {
    await onboardUser(user);
    appLogger.verbose(`[onboarding][hooks] User [${user.username}] is added to onboarding`);
  } catch (error) {
    appLogger.error(`[onboarding][hooks] User [${user.username}] cannot be added to onboarding:\n${error}`);
  }

  // Manual sync
  try {
    await syncElasticUser(user);
    appLogger.error(`[onboarding][hooks] User [${user.username}] is synced to elastic`);
  } catch (error) {
    appLogger.error(`[onboarding][hooks] User [${user.username}] cannot be synced to elastic:\n${error}`);
  }
  try {
    await syncEzrUser(user);
    appLogger.error(`[onboarding][hooks] User [${user.username}] is synced to ezreeport`);
  } catch (error) {
    appLogger.error(`[onboarding][hooks] User [${user.username}] cannot be synced to ezreeport:\n${error}`);
  }
};

const hookOptions = { uniqueResolver: (user) => user.username };

registerHook('user:create', onUserUpsert, hookOptions);
registerHook('user:upsert', onUserUpsert, hookOptions);
