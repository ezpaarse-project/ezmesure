// @ts-check
const config = require('config');
const { client: prisma } = require('./index');

const adminUsername = config.get('admin.username');

const {
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
} = require('../../entities/memberships.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Prisma.UserUpsertArgs} UserUpsertArgs
 * @typedef {import('@prisma/client').Prisma.UserFindUniqueArgs} UserFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.UserFindUniqueOrThrowArgs} UserFindUniqueOrThrowArgs
 * @typedef {import('@prisma/client').Prisma.UserFindManyArgs} UserFindManyArgs
 * @typedef {import('@prisma/client').Prisma.UserUpdateArgs} UserUpdateArgs
 * @typedef {import('@prisma/client').Prisma.UserCreateArgs} UserCreateArgs
 * @typedef {import('@prisma/client').Prisma.UserDeleteArgs} UserDeleteArgs
 * @typedef {{deleteResult: User, deletedUser: User }} UserRemoved
 */
/* eslint-enable max-len */

/**
 * @returns {Promise<User>}
 */
function createAdmin() {
  const username = config.get('admin.username');
  const email = config.get('admin.email');
  const fullName = config.get('admin.fullName');

  const adminData = {
    username,
    email,
    fullName,
    isAdmin: true,
    metadata: { acceptedTerms: true },
  };
  return prisma.user.upsert({
    where: { username },
    update: adminData,
    create: adminData,
  });
}

/**
 * @param {UserCreateArgs} params
 * @returns {Promise<User>}
 */
function create(params) {
  return prisma.user.create(params);
}

/**
 * @param {UserFindManyArgs} params
 * @returns {Promise<User[]>}
 */
function findMany(params) {
  return prisma.user.findMany(params);
}

/**
 * @param {UserFindUniqueArgs} params
 * @returns {Promise<User | null>}
 */
function findUnique(params) {
  return prisma.user.findUnique(params);
}

/**
 * @param {string} username
 * @returns {Promise<User | null>}
 */
function findByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

/*
 * @param {UserFindUniqueOrThrowArgs} params
 * @returns {Promise<User>}
 */
function findUniqueOrThrow(params) {
  return prisma.user.findUniqueOrThrow(params);
}

/**
 * @param {string} domain
 * @returns {Promise<{email: string}[]> | null}
 */
function findEmailOfCorrespondentsWithDomain(domain) {
  return prisma.user.findMany({
    select: { email: true },
    where: {
      email: { endsWith: `@${domain}` },
      memberships: {
        some: {
          roles: {
            hasSome: [DOC_CONTACT, TECH_CONTACT],
          },
        },
      },
    },
  });
}

/**
 * @param {UserUpdateArgs} params
 * @returns {Promise<User>}
 */
function update(params) {
  // TODO manage role
  return prisma.user.update(params);
}

/**
 * Accept terms for user.
 * @param {string} username - Username.
 *
 * @returns {Promise<User>}
 */
function acceptTerms(username) {
  return prisma.user.update({
    where: { username },
    data: {
      metadata: { acceptedTerms: true },
    },
  });
}

/**
 * @param {UserUpsertArgs} params
 * @returns {Promise<User>}
 */
function upsert(params) {
  return prisma.user.upsert(params);
}

/**
 * @param {UserDeleteArgs} params
 *
 * @returns {Promise<UserRemoved | null>}
 */
async function remove(params) {
  const { deleteResult, deletedUser } = await prisma.$transaction(async (tx) => {
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
      return [null, null];
    }

    const findArgs = { where: { username: user.username } };

    await tx.repositoryPermission.deleteMany(findArgs);
    await tx.spacePermission.deleteMany(findArgs);
    await tx.membership.deleteMany(findArgs);

    return {
      deleteResult: await tx.user.delete(params),
      deletedUser: user,
    };
  });

  if (!deletedUser) {
    return null;
  }

  return { deleteResult, deletedUser };
}

/**
 * @param {string} username
 * @returns {Promise<User | null>}
 */
function removeByUsername(username) {
  return prisma.user.delete({ where: { username } });
}

/**
 * @returns {Promise<Array<User> | null>}
 */
async function removeAll() {
  if (process.env.NODE_ENV === 'production') { return null; }
  const users = await this.findMany({
    where: { NOT: { username: adminUsername } },
  });

  await Promise.all(users.map(async (user) => {
    await removeByUsername(user.username);
  }));

  return users;
}

module.exports = {
  createAdmin,
  create,
  findMany,
  findUnique,
  findByUsername,
  findUniqueOrThrow,
  findEmailOfCorrespondentsWithDomain,
  update,
  acceptTerms,
  upsert,
  remove,
  removeByUsername,
  removeAll,
};
