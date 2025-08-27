// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('@prisma/client').ApiKeyRepositoryPermission} ApiKeyRepositoryPermission */
/** @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionUpdateArgs} ApiKeyRepositoryPermissionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionUpsertArgs} ApiKeyRepositoryPermissionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionCountArgs} ApiKeyRepositoryPermissionCountArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionFindUniqueArgs} ApiKeyRepositoryPermissionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionFindManyArgs} ApiKeyRepositoryPermissionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionCreateArgs} ApiKeyRepositoryPermissionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionDeleteArgs} ApiKeyRepositoryPermissionDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {ApiKeyRepositoryPermissionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryPermission>}
 */
function create(params, tx = prisma) {
  return tx.apiKeyRepositoryPermission.create(params);
}

/**
 * @param {ApiKeyRepositoryPermissionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryPermission[]>}
 */
function findMany(params, tx = prisma) {
  return tx.apiKeyRepositoryPermission.findMany(params);
}

/**
 * @param {ApiKeyRepositoryPermissionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryPermission | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.apiKeyRepositoryPermission.findUnique(params);
}

/**
 * @param {ApiKeyRepositoryPermissionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryPermission>}
 */
function update(params, tx = prisma) {
  return tx.apiKeyRepositoryPermission.update(params);
}

/**
 * @param {ApiKeyRepositoryPermissionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryPermission>}
 */
function upsert(params, tx = prisma) {
  return tx.apiKeyRepositoryPermission.upsert(params);
}

/**
 * @param {ApiKeyRepositoryPermissionCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.apiKeyRepositoryPermission.count(params);
}

/**
 * @param {ApiKeyRepositoryPermissionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKeyRepositoryPermission | null>}
 */
function remove(params, tx = prisma) {
  return tx.apiKeyRepositoryPermission.delete(params).catch((e) => {
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
