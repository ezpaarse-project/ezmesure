// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').ElasticRoleRepositoryPermission} ElasticRoleRepositoryPermission
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleRepositoryPermissionUpdateArgs} ElasticRoleRepositoryPermissionUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleRepositoryPermissionUpsertArgs} ElasticRoleRepositoryPermissionUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleRepositoryPermissionFindUniqueArgs} ElasticRoleRepositoryPermissionFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleRepositoryPermissionFindManyArgs} ElasticRoleRepositoryPermissionFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleRepositoryPermissionCreateArgs} ElasticRoleRepositoryPermissionCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.ElasticRoleRepositoryPermissionDeleteArgs} ElasticRoleRepositoryPermissionDeleteArgs
 */
/* eslint-enable max-len */

/**
 * @param {ElasticRoleRepositoryPermissionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryPermission>}
 */
function create(params, tx = prisma) {
  return tx.elasticRoleRepositoryPermission.create(params);
}

/**
 * @param {ElasticRoleRepositoryPermissionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryPermission[]>}
 */
function findMany(params, tx = prisma) {
  return tx.elasticRoleRepositoryPermission.findMany(params);
}

/**
 * @param {ElasticRoleRepositoryPermissionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryPermission | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.elasticRoleRepositoryPermission.findUnique(params);
}

/**
 * @param {ElasticRoleRepositoryPermissionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryPermission>}
 */
function update(params, tx = prisma) {
  return tx.elasticRoleRepositoryPermission.update(params);
}

/**
 * @param {ElasticRoleRepositoryPermissionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryPermission>}
 */
function upsert(params, tx = prisma) {
  return tx.elasticRoleRepositoryPermission.upsert(params);
}

/**
 * @param {ElasticRoleRepositoryPermissionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryPermission | null>}
 */
async function remove(params, tx = prisma) {
  let permission;
  try {
    permission = await tx.elasticRoleRepositoryPermission.delete(params);
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
