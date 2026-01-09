// @ts-check
const config = require('config');
const { client: prisma } = require('./index');

const adminUsername = config.get('admin.username');

const { NOTIFICATION_TYPES } = require('../../utils/notifications/constants');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').User} User
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserUpsertArgs} UserUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserCountArgs} UserCountArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserFindUniqueArgs} UserFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserFindUniqueOrThrowArgs} UserFindUniqueOrThrowArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserFindManyArgs} UserFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserUpdateArgs} UserUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserCreateArgs} UserCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserDeleteArgs} UserDeleteArgs
 *
 * @typedef {import('../../.prisma/client.mjs').Membership} Membership
 * @typedef {import('../../.prisma/client.mjs').RepositoryPermission} RepositoryPermission
 * @typedef {import('../../.prisma/client.mjs').SpacePermission} SpacePermission
 *
 * @typedef {Membership & { repositoryPermissions: RepositoryPermission[], spacePermissions: SpacePermission[] }} OldUserMembership
 * @typedef {User & { memberships: OldUserMembership[] }} OldUser
 * @typedef {{ deleteResult: User, deletedUser: OldUser }} UserRemoved
 */
/* eslint-enable max-len */

/**
 * @param {UserCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<User>}
 */
function create(params, tx = prisma) {
  return tx.user.create(params);
}

/**
 * @param {UserFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<User[]>}
 */
function findMany(params, tx = prisma) {
  return tx.user.findMany(params);
}

/**
 * @param {UserFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<User | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.user.findUnique(params);
}

/**
 * @param {string} username
 * @param {TransactionClient} [tx]
 * @returns {Promise<User | null>}
 */
function findByUsername(username, tx = prisma) {
  return tx.user.findUnique({ where: { username } });
}

/**
 * @param {UserFindUniqueOrThrowArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<User>}
 */
function findUniqueOrThrow(params, tx = prisma) {
  return tx.user.findUniqueOrThrow(params);
}

/**
 * @typedef {{ id: string, name: string, acronym: string | null }} CorrespondantInstitution
 * @typedef {{ institution: CorrespondantInstitution }} CorrespondantMembership
 *
 * @param {string} domain
 * @param {TransactionClient} [tx]
 * @returns {Promise<{ email: string, memberships: CorrespondantMembership[] }[]> | null}
 */
function findEmailOfCorrespondentsWithDomain(domain, tx = prisma) {
  return tx.user.findMany({
    select: {
      email: true,
      memberships: {
        select: {
          institution: {
            select: {
              id: true,
              name: true,
              acronym: true,
            },
          },
        },
      },
    },
    where: {
      email: { endsWith: `@${domain}` },
      memberships: {
        some: {
          roles: {
            some: {
              role: {
                notifications: {
                  has: NOTIFICATION_TYPES.newUserMatchingInstitution,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * @param {UserUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<User>}
 */
function update(params, tx = prisma) {
  return tx.user.update(params);
}

/**
 * Accept terms for user.
 * @param {string} username - Username.
 * @param {TransactionClient} [tx]
 * @returns {Promise<User>}
 */
function acceptTerms(username, tx = prisma) {
  return tx.user.update({
    where: { username },
    data: {
      metadata: { acceptedTerms: true },
    },
  });
}

/**
 * @param {UserUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<User>}
 */
function upsert(params, tx = prisma) {
  return tx.user.upsert(params);
}

/**
 * @param {UserCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.user.count(params);
}

/**
 * @param {UserDeleteArgs} params
 * @param {TransactionClient} [tx]
 *
 * @returns {Promise<UserRemoved | null>}
 */
async function remove(params, tx = prisma) {
  const user = await tx.user.findUnique({
    where: params.where,
    include: {
      memberships: {
        include: {
          repositoryPermissions: true,
          spacePermissions: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    deleteResult: await tx.user.delete(params),
    deletedUser: user,
  };
}

/**
 * @param {string} username
 * @param {TransactionClient} [tx]
 * @returns {Promise<User | null>}
 */
function removeByUsername(username, tx = prisma) {
  return tx.user.delete({ where: { username } });
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Array<User> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx } */
  const transaction = async (txx) => {
    const users = await findMany(
      { where: { NOT: { username: adminUsername } } },
      txx,
    );

    if (users.length === 0) { return null; }

    await Promise.all(
      users.map((user) => removeByUsername(user.username, txx)),
    );

    return users;
  };

  if (tx) {
    return transaction(tx);
  }
  return prisma.$transaction(transaction);
}

module.exports = {
  create,
  findMany,
  findUnique,
  findByUsername,
  findUniqueOrThrow,
  findEmailOfCorrespondentsWithDomain,
  update,
  acceptTerms,
  upsert,
  count,
  remove,
  removeByUsername,
  removeAll,
};
