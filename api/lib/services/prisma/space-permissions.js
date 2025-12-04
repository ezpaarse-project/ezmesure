// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('../../.prisma/client.mjs').SpacePermission} SpacePermission */
/** @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionUpdateArgs} SpacePermissionUpdateArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionUpsertArgs} SpacePermissionUpsertArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionCountArgs} SpacePermissionCountArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionFindUniqueArgs} SpacePermissionFindUniqueArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionFindManyArgs} SpacePermissionFindManyArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionCreateArgs} SpacePermissionCreateArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionDeleteArgs} SpacePermissionDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {SpacePermissionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpacePermission>}
 */
function create(params, tx = prisma) {
  return tx.spacePermission.create(params);
}

/**
 * @param {SpacePermissionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpacePermission[]>}
 */
function findMany(params, tx = prisma) {
  return tx.spacePermission.findMany(params);
}

/**
 * @param {SpacePermissionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpacePermission | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.spacePermission.findUnique(params);
}

/**
 * @param {SpacePermissionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpacePermission>}
 */
function update(params, tx = prisma) {
  return tx.spacePermission.update(params);
}

/**
 * @param {SpacePermissionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpacePermission>}
 */
function upsert(params, tx = prisma) {
  return tx.spacePermission.upsert(params);
}

/**
 * @param {SpacePermissionCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.spacePermission.count(params);
}

/**
 * @param {SpacePermissionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpacePermission | null>}
 */
async function remove(params, tx = prisma) {
  let spacePermission;

  try {
    spacePermission = await tx.spacePermission.delete(params);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }

  return spacePermission;
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
