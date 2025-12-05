// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').ElasticRoleSpacePermission} ElasticRoleSpacePermission
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleSpacePermissionUpdateArgs} ElasticRoleSpacePermissionUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleSpacePermissionUpsertArgs} ElasticRoleSpacePermissionUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleSpacePermissionFindUniqueArgs} ElasticRoleSpacePermissionFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleSpacePermissionFindManyArgs} ElasticRoleSpacePermissionFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleSpacePermissionCreateArgs} ElasticRoleSpacePermissionCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleSpacePermissionDeleteArgs} ElasticRoleSpacePermissionDeleteArgs
 */
/* eslint-enable max-len */

/**
 * @param {ElasticRoleSpacePermissionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleSpacePermission>}
 */
function create(params, tx = prisma) {
  return tx.elasticRoleSpacePermission.create(params);
}

/**
 * @param {ElasticRoleSpacePermissionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleSpacePermission[]>}
 */
function findMany(params, tx = prisma) {
  return tx.elasticRoleSpacePermission.findMany(params);
}

/**
 * @param {ElasticRoleSpacePermissionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleSpacePermission | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.elasticRoleSpacePermission.findUnique(params);
}

/**
 * @param {ElasticRoleSpacePermissionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleSpacePermission>}
 */
function update(params, tx = prisma) {
  return tx.elasticRoleSpacePermission.update(params);
}

/**
 * @param {ElasticRoleSpacePermissionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleSpacePermission>}
 */
function upsert(params, tx = prisma) {
  return tx.elasticRoleSpacePermission.upsert(params);
}

/**
 * @param {ElasticRoleSpacePermissionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleSpacePermission | null>}
 */
async function remove(params, tx = prisma) {
  let permission;
  try {
    permission = await tx.elasticRoleSpacePermission.delete(params);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }

  return permission;
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
  remove,
};
