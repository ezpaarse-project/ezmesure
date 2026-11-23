// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('../../.prisma/client.mjs').ApiKeyRepositoryAliasPermission} ApiKeyRepositoryAliasPermission */
/** @typedef {import('../../.prisma/client.mjs').Prisma.ApiKeyRepositoryAliasPermissionUpdateArgs} ApiKeyRepositoryAliasPermissionUpdateArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.ApiKeyRepositoryAliasPermissionUpsertArgs} ApiKeyRepositoryAliasPermissionUpsertArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.ApiKeyRepositoryAliasPermissionCountArgs} ApiKeyRepositoryAliasPermissionCountArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.ApiKeyRepositoryAliasPermissionFindUniqueArgs} ApiKeyRepositoryAliasPermissionFindUniqueArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.ApiKeyRepositoryAliasPermissionFindManyArgs} ApiKeyRepositoryAliasPermissionFindManyArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.ApiKeyRepositoryAliasPermissionCreateArgs} ApiKeyRepositoryAliasPermissionCreateArgs */
/** @typedef {import('../../.prisma/client.mjs').Prisma.ApiKeyRepositoryAliasPermissionDeleteArgs} ApiKeyRepositoryAliasPermissionDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {ApiKeyRepositoryAliasPermissionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryAliasPermission>}
 */
function create(params, tx = prisma) {
  return tx.apiKeyRepositoryAliasPermission.create(params);
}

/**
 * @param {ApiKeyRepositoryAliasPermissionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryAliasPermission[]>}
 */
function findMany(params, tx = prisma) {
  return tx.apiKeyRepositoryAliasPermission.findMany(params);
}

/**
 * @param {ApiKeyRepositoryAliasPermissionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryAliasPermission | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.apiKeyRepositoryAliasPermission.findUnique(params);
}

/**
 * @param {ApiKeyRepositoryAliasPermissionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryAliasPermission>}
 */
function update(params, tx = prisma) {
  return tx.apiKeyRepositoryAliasPermission.update(params);
}

/**
 * @param {ApiKeyRepositoryAliasPermissionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryAliasPermission>}
 */
function upsert(params, tx = prisma) {
  return tx.apiKeyRepositoryAliasPermission.upsert(params);
}

/**
 * @param {ApiKeyRepositoryAliasPermissionCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.apiKeyRepositoryAliasPermission.count(params);
}

/**
 * @param {ApiKeyRepositoryAliasPermissionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryAliasPermission | null>}
 */
function remove(params, tx = prisma) {
  return tx.apiKeyRepositoryAliasPermission.delete(params).catch((e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return null;
    }
    throw e;
  });
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
