// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').MembershipRole} MembershipRole
 * @typedef {import('../../.prisma/client.mjs').Membership} Membership
 * @typedef {import('../../.prisma/client.mjs').Role} Role
 * @typedef {import('../../.prisma/client.mjs').Prisma.MembershipRoleFindUniqueArgs} MembershipRoleFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.MembershipRoleFindManyArgs} MembershipRoleFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.MembershipRoleUpdateArgs} MembershipRoleUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.MembershipRoleCreateArgs} MembershipRoleCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.MembershipRoleDeleteArgs} MembershipRoleDeleteArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.MembershipRoleUpsertArgs} MembershipRoleUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.MembershipRoleCountArgs} MembershipRoleCountArgs
 *
 * @typedef {import('../../.prisma/client.mjs').SpacePermission} SpacePermission
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
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

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Array<MembershipRole> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const membershipRoles = await findMany({}, txx);

    if (membershipRoles.length === 0) { return null; }

    await Promise.all(
      membershipRoles.map((membershipRole) => remove(
        {
          where: {
            username_institutionId_roleId: {
              username: membershipRole.username,
              institutionId: membershipRole.institutionId,
              roleId: membershipRole.roleId,
            },
          },
        },
        txx,
      )),
    );

    return membershipRoles;
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
  update,
  upsert,
  count,
  remove,
  removeAll,
};
