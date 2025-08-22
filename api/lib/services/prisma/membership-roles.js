// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').MembershipRole} MembershipRole
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Role} Role
 * @typedef {import('@prisma/client').Prisma.MembershipRoleFindUniqueArgs} MembershipRoleFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.MembershipRoleFindManyArgs} MembershipRoleFindManyArgs
 * @typedef {import('@prisma/client').Prisma.MembershipRoleUpdateArgs} MembershipRoleUpdateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipRoleCreateArgs} MembershipRoleCreateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipRoleDeleteArgs} MembershipRoleDeleteArgs
 * @typedef {import('@prisma/client').Prisma.MembershipRoleUpsertArgs} MembershipRoleUpsertArgs
 * @typedef {import('@prisma/client').Prisma.MembershipRoleCountArgs} MembershipRoleCountArgs
 *
 * @typedef {import('@prisma/client').SpacePermission} SpacePermission
 * @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
 *
 * @typedef {MembershipRole & { membership: Membership, role: Role }} OldMembershipRole
 * @typedef {{ deleteResult: MembershipRole, role: OldMembershipRole }} MembershipRoleRemoved
 */
/* eslint-enable max-len */

/**
 * @param {MembershipRoleCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<MembershipRole>}
 */
function create(params, tx = prisma) {
  return tx.membershipRole.create(params);
}

/**
 * @param {MembershipRoleFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<MembershipRole[]>}
 */
function findMany(params, tx = prisma) {
  return tx.membershipRole.findMany(params);
}

/**
 * @param {MembershipRoleFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<MembershipRole | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.membershipRole.findUnique(params);
}

/**
 * @param {MembershipRoleUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<MembershipRole>}
 */
function update(params, tx = prisma) {
  return tx.membershipRole.update(params);
}

/**
 * @param {MembershipRoleUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<MembershipRole>}
 */
function upsert(params, tx = prisma) {
  return tx.membershipRole.upsert(params);
}

/**
 * @param {MembershipRoleCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.membershipRole.count(params);
}

/**
 * @param {MembershipRoleDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<MembershipRoleRemoved | null>}
 */
async function remove(params, tx = prisma) {
  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const role = await txx.membershipRole.findUnique({
      where: params.where,
      include: {
        membership: true,
        role: true,
      },
    });

    if (!role) {
      return null;
    }

    return {
      deleteResult: await txx.membershipRole.delete(params),
      role,
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

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
  count,
  remove,
};
