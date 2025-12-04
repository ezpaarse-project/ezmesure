// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').RepositoryPermission} RepositoryPermission
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryPermissionUpdateArgs} RepositoryPermissionUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryPermissionUpsertArgs} RepositoryPermissionUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryPermissionFindUniqueArgs} RepositoryPermissionFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryPermissionFindManyArgs} RepositoryPermissionFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryPermissionCreateArgs} RepositoryPermissionCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryPermissionDeleteArgs} RepositoryPermissionDeleteArgs
 */
/* eslint-enable max-len */

/**
 * @param {RepositoryPermissionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryPermission>}
 */
function create(params, tx = prisma) {
  return tx.repositoryPermission.create(params);
}

/**
 * @param {RepositoryPermissionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryPermission[]>}
 */
function findMany(params, tx = prisma) {
  return tx.repositoryPermission.findMany(params);
}

/**
 * @param {RepositoryPermissionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryPermission | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.repositoryPermission.findUnique(params);
}

/**
 * @param {string} institutionId
 * @param {string} pattern
 * @param {string} username
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryPermission | null>}
 */
function findById(institutionId, pattern, username, tx = prisma) {
  return tx.repositoryPermission.findUnique({
    where: {
      username_institutionId_repositoryPattern: {
        username,
        institutionId,
        repositoryPattern: pattern,
      },
    },
  });
}

/**
 * @param {RepositoryPermissionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryPermission>}
 */
function update(params, tx = prisma) {
  return tx.repositoryPermission.update(params);
}

/**
 * @param {RepositoryPermissionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryPermission>}
 */
function upsert(params, tx = prisma) {
  return tx.repositoryPermission.upsert(params);
}

/**
 * @param {RepositoryPermissionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryPermission | null>}
 */
async function remove(params, tx = prisma) {
  let permission;
  try {
    permission = await tx.repositoryPermission.delete(params);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }

  return permission;
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryPermission[] | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const permissions = await findMany({}, txx);

    if (permissions.length === 0) { return null; }

    await Promise.all(
      permissions.map(
        (permission) => remove(
          {
            where: {
              username_institutionId_repositoryPattern: {
                username: permission.username,
                institutionId: permission.institutionId,
                repositoryPattern: permission.repositoryPattern,
              },
            },
          },
          txx,
        ),
      ),
    );

    return permissions;
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
  findById,
  update,
  upsert,
  remove,
  removeAll,
};
