// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { client: prisma } = require('../../services/prisma');
const { syncUser: syncElasticUser } = require('../../services/sync/elastic/users');
const { upsertFromUser: syncEzrUser } = require('../../services/ezreeport/users');

const { MEMBER_ROLES, FEATURES } = require('../../entities/memberships.dto');

/**
 * @typedef {import('../../.prisma/client.mjs').User} User
 */

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

  const permissions = Object.values(FEATURES).map((perm) => perm.read);

  try {
    // Get onboarding institutions
    const onboardingIds = await prisma.institution.findMany({
      where: { onboarding: true },
      select: {
        id: true,
        spaces: { select: { id: true } },
        repositories: { select: { pattern: true } },
        repositoryAliases: { select: { pattern: true } },
      },
    });

    // Using prisma instead of service to avoid loops between hooks
    await prisma.$transaction(onboardingIds.map(
      (institution) => prisma.membership.create({
        data: {
          user: { connect: { username: user.username } },
          institution: { connect: { id: institution.id } },
          locked: false,
          roles: [MEMBER_ROLES.guest],
          permissions,

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
