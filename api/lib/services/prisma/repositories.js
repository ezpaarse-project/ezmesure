// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').Repository} Repository
 * @typedef {import('@prisma/client').Prisma.RepositoryUpdateArgs} RepositoryUpdateArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryUpsertArgs} RepositoryUpsertArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryCountArgs} RepositoryCountArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryFindUniqueArgs} RepositoryFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryFindFirstArgs} RepositoryFindFirstArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryFindManyArgs} RepositoryFindManyArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryCreateArgs} RepositoryCreateArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryDeleteArgs} RepositoryDeleteArgs
 *
 * @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission
 * @typedef {import('@prisma/client').Institution} Institution
 *
 * @typedef {Repository & { permissions: RepositoryPermission[], institutions: Institution[] }} OldRepository
 * @typedef {{deleteResult: Repository, deletedRepository: OldRepository }} RepositoryRemoved
 * @typedef {{newRepository: Repository, oldRepository: OldRepository }} RepositoryUpdated
 */
/* eslint-enable max-len */

/**
 * @param {RepositoryCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Repository>}
 */
function create(params, tx = prisma) {
  return tx.repository.create(params);
}

/**
 * @param {RepositoryFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Repository[]>}
 */
function findMany(params, tx = prisma) {
  return tx.repository.findMany(params);
}

/**
 * @param {RepositoryFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Repository | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.repository.findUnique(params);
}

/**
 * @param {RepositoryFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Repository | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.repository.findFirst(params);
}

/**
 * @param {string} pattern
 * @param {TransactionClient} [tx]
 * @returns {Promise<Repository | null>}
 */
function findByPattern(pattern, tx = prisma) {
  return tx.repository.findUnique({ where: { pattern } });
}

/**
 * @param {RepositoryUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Repository>}
 */
function update(params, tx = prisma) {
  return tx.repository.update(params);
}

/**
 * @param {RepositoryUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Repository>}
 */
function upsert(params, tx = prisma) {
  return tx.repository.upsert(params);
}

/**
 * @param {RepositoryCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.repository.count(params);
}

/**
 *
 * @param {string} pattern
 * @param {string} institutionId
 * @param {TransactionClient} [tx]
 */
function connectInstitution(pattern, institutionId, tx = prisma) {
  return tx.repository.update({
    where: { pattern },
    data: { institutions: { connect: { id: institutionId } } },
  });
}

/**
 * Disconnect a repository from an institution and remove all associated permissions
 * @param {string} pattern
 * @param {string} institutionId
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryUpdated | null>}
 */
async function disconnectInstitution(pattern, institutionId, tx) {
  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const currentRepository = await txx.repository.findUnique({
      where: { pattern },
      include: {
        permissions: { where: { institutionId } },
        institutions: { where: { id: institutionId } },
      },
    });

    if (!currentRepository) {
      return null;
    }

    await txx.repositoryPermission.deleteMany({
      where: {
        repositoryPattern: currentRepository.pattern,
        institutionId,
      },
    });

    const updatedRepository = await txx.repository.update({
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
      newRepository: updatedRepository,
      oldRepository: currentRepository,
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
 * @param {RepositoryDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryRemoved | null>}
 */
async function remove(params, tx = prisma) {
  const repository = await tx.repository.findUnique({
    where: params.where,
    include: {
      permissions: true,
      institutions: true,
    },
  });

  if (!repository) {
    return null;
  }

  return {
    deleteResult: await tx.repository.delete(params),
    deletedRepository: repository,
  };
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Repository[] | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const repositories = await findMany({}, txx);

    if (repositories.length === 0) { return null; }

    await Promise.all(
      repositories.map((repository) => remove(
        { where: { pattern: repository.pattern } },
        txx,
      )),
    );

    return repositories;
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
  findFirst,
  findByPattern,
  update,
  upsert,
  count,
  connectInstitution,
  disconnectInstitution,
  remove,
  removeAll,
};
