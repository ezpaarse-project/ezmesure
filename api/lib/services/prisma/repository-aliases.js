// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasUpdateArgs} RepositoryAliasUpdateArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasUpsertArgs} RepositoryAliasUpsertArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasCountArgs} RepositoryAliasCountArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasFindUniqueArgs} RepositoryAliasFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasFindFirstArgs} RepositoryAliasFindFirstArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasFindManyArgs} RepositoryAliasFindManyArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasCreateArgs} RepositoryAliasCreateArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasDeleteArgs} RepositoryAliasDeleteArgs
 *
 * @typedef {import('@prisma/client').RepositoryAliasPermission} RepositoryAliasPermission
 *
 * @typedef {RepositoryAlias & { permissions: RepositoryAliasPermission[] }} OldRepositoryAlias
 * @typedef {{deleteResult: RepositoryAlias, deletedRepositoryAlias: OldRepositoryAlias }} RepositoryAliasRemoved
 * @typedef {{newRepositoryAlias: RepositoryAlias, oldRepositoryAlias: OldRepositoryAlias }} RepositoryAliasUpdated
 */
/* eslint-enable max-len */

/**
 * @param {RepositoryAliasCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAlias>}
 */
function create(params, tx = prisma) {
  return tx.repositoryAlias.create(params);
}

/**
 * @param {RepositoryAliasFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAlias[]>}
 */
function findMany(params, tx = prisma) {
  return tx.repositoryAlias.findMany(params);
}

/**
 * @param {RepositoryAliasFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAlias | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.repositoryAlias.findUnique(params);
}

/**
 * @param {RepositoryAliasFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAlias | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.repositoryAlias.findFirst(params);
}

/**
 * @param {string} pattern
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAlias | null>}
 */
function findByPattern(pattern, tx = prisma) {
  return tx.repositoryAlias.findUnique({ where: { pattern } });
}

/**
 * @param {RepositoryAliasUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAlias>}
 */
function update(params, tx = prisma) {
  return tx.repositoryAlias.update(params);
}

/**
 * @param {RepositoryAliasUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAlias>}
 */
function upsert(params, tx = prisma) {
  return tx.repositoryAlias.upsert(params);
}

/**
 * @param {RepositoryAliasCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.repositoryAlias.count(params);
}

/**
 *
 * @param {string} pattern
 * @param {string} institutionId
 * @param {TransactionClient} [tx]
 */
function connectInstitution(pattern, institutionId, tx = prisma) {
  return tx.repositoryAlias.update({
    where: { pattern },
    data: { institutions: { connect: { id: institutionId } } },
  });
}

/**
 * Disconnect a repositoryAlias from an institution and remove all associated permissions
 * @param {string} pattern
 * @param {string} institutionId
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasUpdated | null>}
 */
async function disconnectInstitution(pattern, institutionId, tx) {
  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const currentRepositoryAlias = await txx.repositoryAlias.findUnique({
      where: { pattern },
      include: {
        permissions: { where: { institutionId } },
        institutions: { where: { id: institutionId } },
      },
    });

    if (!currentRepositoryAlias) {
      return null;
    }

    await txx.repositoryAliasPermission.deleteMany({
      where: {
        aliasPattern: currentRepositoryAlias.pattern,
        institutionId,
      },
    });

    const updatedRepositoryAlias = await txx.repositoryAlias.update({
      where: { pattern },
      data: {
        institutions: {
          disconnect: {
            id: institutionId,
          },
        },
      },
    });

    return {
      newRepositoryAlias: updatedRepositoryAlias,
      oldRepositoryAlias: currentRepositoryAlias,
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
 * @param {RepositoryAliasDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasRemoved | null>}
 */
async function remove(params, tx = prisma) {
  const repositoryAlias = await tx.repositoryAlias.findUnique({
    where: params.where,
    include: {
      permissions: true,
    },
  });

  if (!repositoryAlias) {
    return null;
  }

  return {
    deleteResult: await tx.repositoryAlias.delete(params),
    deletedRepositoryAlias: repositoryAlias,
  };
}

module.exports = {
  create,
  findMany,
  findUnique,
  findFirst,
  findByPattern,
  update,
  upsert,
  count,
  connectInstitution,
  disconnectInstitution,
  remove,
};
