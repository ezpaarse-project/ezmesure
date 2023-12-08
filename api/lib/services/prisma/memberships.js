// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Prisma.MembershipUpsertArgs} MembershipUpsertArgs
 * @typedef {import('@prisma/client').Prisma.MembershipFindUniqueArgs} MembershipFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.MembershipFindManyArgs} MembershipFindManyArgs
 * @typedef {import('@prisma/client').Prisma.MembershipUpdateArgs} MembershipUpdateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipCreateArgs} MembershipCreateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipDeleteArgs} MembershipDeleteArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionDeleteManyArgs} RepositoryPermissionDeleteManyArgs
 * @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
 */
/* eslint-enable max-len */

/**
 * @param {MembershipCreateArgs} params
 * @returns {Promise<Membership>}
 */
function create(params) {
  return prisma.membership.create(params);
}

/**
 * @param {MembershipFindManyArgs} params
 * @returns {Promise<Membership[]>}
 */
function findMany(params) {
  return prisma.membership.findMany(params);
}

/**
 * @param {MembershipFindUniqueArgs} params
 * @returns {Promise<Membership | null>}
 */
function findUnique(params) {
  return prisma.membership.findUnique(params);
}

/**
 * @param {string} institutionId
 * @param {string} username
 * @param {Object | null} includes
 * @returns {Promise<Membership | null>}
 */
function findByID(institutionId, username, includes = null) {
  let include;
  if (includes) {
    include = {
      ...includes,
    };
  }
  return prisma.membership.findUnique({
    where: {
      username_institutionId: {
        institutionId,
        username,
      },
    },
    include,
  });
}

/**
 * @param {MembershipUpdateArgs} params
 * @returns {Promise<Membership>}
 */
function update(params) {
  return prisma.membership.update(params);
}

/**
 * @param {MembershipUpsertArgs} params
 * @returns {Promise<Membership>}
 */
function upsert(params) {
  return prisma.membership.upsert(params);
}

/**
 * @param {MembershipDeleteArgs} params
 * @returns {Promise<Membership | null>}
 */
async function remove(params) {
  const { deleteResult, deletedMembership } = await prisma.$transaction(async (tx) => {
    const membership = await tx.membership.findUnique({
      where: params.where,
      include: {
        repositoryPermissions: true,
        spacePermissions: true,
      },
    });

    if (!membership) {
      return [null, null];
    }

    /** @type {RepositoryPermissionDeleteManyArgs | SpacePermissionDeleteManyArgs} */
    const findArgs = {
      where: {
        username: membership.username,
        institutionId: membership.institutionId,
      },
    };

    await tx.repositoryPermission.deleteMany(findArgs);
    await tx.spacePermission.deleteMany(findArgs);

    return {
      deleteResult: await tx.membership.delete(params),
      deletedMembership: membership,
    };
  });

  if (!deletedMembership) {
    return null;
  }

  return deleteResult;
}

/**
 * @returns {Promise<Array<Membership> | null>}
 */
async function removeAll() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  const memberships = await findMany({});

  if (memberships.length === 0) { return null; }

  await Promise.all(memberships.map(async (membership) => {
    await remove({
      where: {
        username_institutionId: {
          username: membership.username,
          institutionId: membership.institutionId,
        },
      },
    });
  }));

  return memberships;
}

module.exports = {
  create,
  findMany,
  findUnique,
  findByID,
  update,
  upsert,
  remove,
  removeAll,
};
