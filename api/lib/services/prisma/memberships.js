// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Prisma.MembershipFindUniqueArgs} MembershipFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.MembershipFindManyArgs} MembershipFindManyArgs
 * @typedef {import('@prisma/client').Prisma.MembershipUpdateArgs} MembershipUpdateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipCreateArgs} MembershipCreateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipDeleteArgs} MembershipDeleteArgs
 * @typedef {import('@prisma/client').Prisma.MembershipUpsertArgs} MembershipUpsertArgs
 * @typedef {import('@prisma/client').Prisma.MembershipCountArgs} MembershipCountArgs
 * @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionDeleteManyArgs} RepositoryPermissionDeleteManyArgs
 *
 * @typedef {import('@prisma/client').SpacePermission} SpacePermission
 * @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
 *
 * @typedef {Membership & { repositoryPermissions: RepositoryPermission[], spacePermissions: SpacePermission[] }} OldMembership
 * @typedef {{ deleteResult: Membership, membership: OldMembership }} MembershipRemoved
 */
/* eslint-enable max-len */

/**
 * @param {MembershipCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Membership>}
 */
function create(params, tx = prisma) {
  return tx.membership.create(params);
}

/**
 * @param {MembershipFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Membership[]>}
 */
function findMany(params, tx = prisma) {
  return tx.membership.findMany(params);
}

/**
 * @param {MembershipFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Membership | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.membership.findUnique(params);
}

/**
 * @param {string} institutionId
 * @param {string} username
 * @param {Object | null} includes
 * @param {TransactionClient} [tx]
 * @returns {Promise<Membership | null>}
 */
function findByID(institutionId, username, includes = null, tx = prisma) {
  let include;
  if (includes) {
    include = {
      ...includes,
    };
  }
  return tx.membership.findUnique({
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
 * @param {TransactionClient} [tx]
 * @returns {Promise<Membership>}
 */
function update(params, tx = prisma) {
  return tx.membership.update(params);
}

/**
 * @param {MembershipUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Membership>}
 */
function upsert(params, tx = prisma) {
  return tx.membership.upsert(params);
}

/**
 * @param {MembershipCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.membership.count(params);
}

/**
 * @param {MembershipDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<MembershipRemoved | null>}
 */
async function remove(params, tx = prisma) {
  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const membership = await txx.membership.findUnique({
      where: params.where,
      include: {
        repositoryPermissions: true,
        spacePermissions: true,
      },
    });

    if (!membership) {
      return null;
    }

    return {
      deleteResult: await txx.membership.delete(params),
      membership,
    };
  };

  let transactionResult;
  if (tx) {
    transactionResult = await transaction(tx);
  } else {
    transactionResult = await prisma.$transaction(transaction);
  }

  return transactionResult;
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Array<Membership> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const memberships = await findMany({}, txx);

    if (memberships.length === 0) { return null; }

    await Promise.all(
      memberships.map((membership) => remove(
        {
          where: {
            username_institutionId: {
              username: membership.username,
              institutionId: membership.institutionId,
            },
          },
        },
        txx,
      )),
    );

    return memberships;
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
  findByID,
  update,
  upsert,
  count,
  remove,
  removeAll,
};
