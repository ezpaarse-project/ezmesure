// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client').ElasticRoleRepositoryAliasPermission} ElasticRoleRepositoryAliasPermission
 * @typedef {import('../../.prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionUpdateArgs} ElasticRoleRepositoryAliasPermissionUpdateArgs
 * @typedef {import('../../.prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionUpsertArgs} ElasticRoleRepositoryAliasPermissionUpsertArgs
 * @typedef {import('../../.prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionFindUniqueArgs} ElasticRoleRepositoryAliasPermissionFindUniqueArgs
 * @typedef {import('../../.prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionFindManyArgs} ElasticRoleRepositoryAliasPermissionFindManyArgs
 * @typedef {import('../../.prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionCreateArgs} ElasticRoleRepositoryAliasPermissionCreateArgs
 * @typedef {import('../../.prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionDeleteArgs} ElasticRoleRepositoryAliasPermissionDeleteArgs
 */
/* eslint-enable max-len */

/**
 * @param {ElasticRoleRepositoryAliasPermissionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryAliasPermission>}
 */
function create(params, tx = prisma) {
  return tx.elasticRoleRepositoryAliasPermission.create(params);
}

/**
 * @param {ElasticRoleRepositoryAliasPermissionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryAliasPermission[]>}
 */
function findMany(params, tx = prisma) {
  return tx.elasticRoleRepositoryAliasPermission.findMany(params);
}

/**
 * @param {ElasticRoleRepositoryAliasPermissionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryAliasPermission | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.elasticRoleRepositoryAliasPermission.findUnique(params);
}

/**
 * @param {ElasticRoleRepositoryAliasPermissionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryAliasPermission>}
 */
function update(params, tx = prisma) {
  return tx.elasticRoleRepositoryAliasPermission.update(params);
}

/**
 * @param {ElasticRoleRepositoryAliasPermissionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryAliasPermission>}
 */
function upsert(params, tx = prisma) {
  return tx.elasticRoleRepositoryAliasPermission.upsert(params);
}

/**
 * @param {ElasticRoleRepositoryAliasPermissionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRepositoryAliasPermission | null>}
 */
async function remove(params, tx = prisma) {
  let permission;
  try {
    permission = await tx.elasticRoleRepositoryAliasPermission.delete(params);
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
