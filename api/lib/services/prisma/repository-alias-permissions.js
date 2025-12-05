// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').RepositoryAliasPermission} RepositoryAliasPermission
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasPermissionUpdateArgs} RepositoryAliasPermissionUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasPermissionUpsertArgs} RepositoryAliasPermissionUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasPermissionFindUniqueArgs} RepositoryAliasPermissionFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasPermissionFindManyArgs} RepositoryAliasPermissionFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasPermissionCreateArgs} RepositoryAliasPermissionCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasPermissionDeleteArgs} RepositoryAliasPermissionDeleteArgs
 */
/* eslint-enable max-len */

/**
 * @param {RepositoryAliasPermissionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasPermission>}
 */
function create(params, tx = prisma) {
  return tx.repositoryAliasPermission.create(params);
}

/**
 * @param {RepositoryAliasPermissionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasPermission[]>}
 */
function findMany(params, tx = prisma) {
  return tx.repositoryAliasPermission.findMany(params);
}

/**
 * @param {RepositoryAliasPermissionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasPermission | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.repositoryAliasPermission.findUnique(params);
}

/**
 * @param {string} institutionId
 * @param {string} pattern
 * @param {string} username
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasPermission | null>}
 */
function findById(institutionId, pattern, username, tx = prisma) {
  return tx.repositoryAliasPermission.findUnique({
    where: {
      username_institutionId_aliasPattern: {
        username,
        institutionId,
        aliasPattern: pattern,
      },
    },
  });
}

/**
 * @param {RepositoryAliasPermissionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasPermission>}
 */
function update(params, tx = prisma) {
  return tx.repositoryAliasPermission.update(params);
}

/**
 * @param {RepositoryAliasPermissionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasPermission>}
 */
function upsert(params, tx = prisma) {
  return tx.repositoryAliasPermission.upsert(params);
}

/**
 * @param {RepositoryAliasPermissionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasPermission | null>}
 */
async function remove(params, tx = prisma) {
  let permission;
  try {
    permission = await tx.repositoryAliasPermission.delete(params);
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
  findById,
  update,
  upsert,
  remove,
};
