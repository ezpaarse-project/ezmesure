// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').Role} Role
 * @typedef {import('../../.prisma/client.mjs').MembershipRole} MembershipRole
 * @typedef {import('../../.prisma/client.mjs').Prisma.RoleFindUniqueArgs} RoleFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RoleFindManyArgs} RoleFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RoleUpdateArgs} RoleUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RoleCreateArgs} RoleCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RoleDeleteArgs} RoleDeleteArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RoleUpsertArgs} RoleUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RoleCountArgs} RoleCountArgs
 *
 * @typedef {import('../../.prisma/client.mjs').SpacePermission} SpacePermission
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
 *
 * @typedef {Role & { membershipRoles: MembershipRole[] }} OldRole
 * @typedef {{ deleteResult: Role, role: OldRole }} RoleRemoved
 */
/* eslint-enable max-len */

/**
 * @param {RoleCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Role>}
 */
function create(params, tx = prisma) {
  return tx.role.create(params);
}

/**
 * @param {RoleFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Role[]>}
 */
function findMany(params, tx = prisma) {
  return tx.role.findMany(params);
}

/**
 * @param {RoleFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Role | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.role.findUnique(params);
}

/**
 * @param {string} roleId
 * @param {Object | null} includes
 * @param {TransactionClient} [tx]
 * @returns {Promise<Role | null>}
 */
function findByID(roleId, includes = null, tx = prisma) {
  let include;
  if (includes) {
    include = {
      ...includes,
    };
  }
  return tx.role.findUnique({
    where: { id: roleId },
    include,
  });
}

/**
 * @param {RoleUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Role>}
 */
function update(params, tx = prisma) {
  return tx.role.update(params);
}

/**
 * @param {RoleUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Role>}
 */
function upsert(params, tx = prisma) {
  return tx.role.upsert(params);
}

/**
 * @param {RoleCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.role.count(params);
}

/**
 * @param {RoleDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RoleRemoved | null>}
 */
async function remove(params, tx = prisma) {
  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const role = await txx.role.findUnique({
      where: params.where,
      include: {
        membershipRoles: true,
      },
    });

    if (!role) {
      return null;
    }

    return {
      deleteResult: await txx.role.delete(params),
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
 * @returns {Promise<Array<Role> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const roles = await findMany({}, txx);

    if (roles.length === 0) { return null; }

    await Promise.all(
      roles.map((role) => remove({ where: { id: role.id } }, txx)),
    );

    return roles;
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
