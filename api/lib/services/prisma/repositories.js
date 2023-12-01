// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Repository} Repository
 * @typedef {import('@prisma/client').Prisma.RepositoryUpdateArgs} RepositoryUpdateArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryUpsertArgs} RepositoryUpsertArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryFindUniqueArgs} RepositoryFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryFindFirstArgs} RepositoryFindFirstArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryFindManyArgs} RepositoryFindManyArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryCreateArgs} RepositoryCreateArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryDeleteArgs} RepositoryDeleteArgs
 * @typedef {{deleteResult: Repository, deletedRepository: Repository }} RepositoryRemoved
 */
/* eslint-enable max-len */

/**
 * @param {RepositoryCreateArgs} params
 * @returns {Promise<Repository>}
 */
function create(params) {
  return prisma.repository.create(params);
}

/**
 * @param {RepositoryFindManyArgs} params
 * @returns {Promise<Repository[]>}
 */
function findMany(params) {
  return prisma.repository.findMany(params);
}

/**
 * @param {RepositoryFindUniqueArgs} params
 * @returns {Promise<Repository | null>}
 */
function findUnique(params) {
  return prisma.repository.findUnique(params);
}

/**
 * @param {RepositoryFindFirstArgs} params
 * @returns {Promise<Repository | null>}
 */
function findFirst(params) {
  return prisma.repository.findFirst(params);
}

/**
 * @param {string} pattern
 * @returns {Promise<Repository | null>}
 */
function findByPattern(pattern) {
  return prisma.repository.findUnique({ where: { pattern } });
}

/**
 * @param {RepositoryUpdateArgs} params
 * @returns {Promise<Repository>}
 */
function update(params) {
  return prisma.repository.update(params);
}

/**
 * @param {RepositoryUpsertArgs} params
 * @returns {Promise<Repository>}
 */
function upsert(params) {
  return prisma.repository.upsert(params);
}

/**
 *
 * @param {string} pattern
 * @param {string} institutionId
 */
function connectInstitution(pattern, institutionId) {
  return prisma.repository.update({
    where: { pattern },
    data: { institutions: { connect: { id: institutionId } } },
  });
}

/**
 * Disconnect a repository from an institution and remove all associated permissions
 * @param {string} pattern
 * @param {string} institutionId
 * @returns {Promise<Repository | null>}
 */
async function disconnectInstitution(pattern, institutionId) {
  const { newRepository, oldRepository } = await prisma.$transaction(async (tx) => {
    const currentRepository = await tx.repository.findUnique({
      where: { pattern },
      include: {
        permissions: { where: { institutionId } },
        institutions: { where: { id: institutionId } },
      },
    });

    if (!currentRepository) {
      return null;
    }

    await tx.repositoryPermission.deleteMany({
      where: {
        repositoryPattern: currentRepository.pattern,
        institutionId,
      },
    });

    const updatedRepository = await tx.repository.update({
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
      updatedRepository,
      currentRepository,
    };
  });

  if (!oldRepository) {
    return null;
  }
  return { newRepository, oldRepository };
}

/**
 * @param {RepositoryDeleteArgs} params
 * @returns {Promise<RepositoryRemoved | null>}
 */
async function remove(params) {
  const [deleteResult, deletedRepository] = await prisma.$transaction(async (tx) => {
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

    await tx.repositoryPermission.deleteMany({
      where: {
        repositoryPattern: repository.pattern,
      },
    });

    return [
      await tx.repository.delete(params),
      repository,
    ];
  });

  if (!deletedRepository) {
    return null;
  }

  return { deleteResult, deletedRepository };
}

/**
 * @returns {Promise<Array<Repository> | null>}
 */
async function removeAll() {
  if (process.env.NODE_ENV === 'production') { return null; }

  const repositories = await this.findMany({});

  await Promise.all(repositories.map(async (repository) => {
    await remove({
      where: {
        pattern: repository.pattern,
      },
    });
  }));

  return repositories;
}

module.exports = {
  create,
  findMany,
  findUnique,
  findFirst,
  findByPattern,
  update,
  upsert,
  connectInstitution,
  disconnectInstitution,
  remove,
  removeAll,
};
