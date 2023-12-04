// @ts-check
const { client: prisma } = require('../services/prisma.service');
const { triggerHooks } = require('../hooks/hookEmitter');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Repository} Repository */
/** @typedef {import('@prisma/client').Prisma.RepositoryUpdateArgs} RepositoryUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryUpsertArgs} RepositoryUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryFindUniqueArgs} RepositoryFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryFindFirstArgs} RepositoryFindFirstArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryFindManyArgs} RepositoryFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryCreateArgs} RepositoryCreateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryDeleteArgs} RepositoryDeleteArgs */
/* eslint-enable max-len */

module.exports = class RepositoriesService {
  /**
   * @param {RepositoryCreateArgs} params
   * @returns {Promise<Repository>}
   */
  static async create(params) {
    const repository = await prisma.repository.create(params);
    triggerHooks('repository:create', repository);
    return repository;
  }

  /**
   * @param {RepositoryFindManyArgs} params
   * @returns {Promise<Repository[]>}
   */
  static findMany(params) {
    return prisma.repository.findMany(params);
  }

  /**
   * @param {RepositoryFindUniqueArgs} params
   * @returns {Promise<Repository | null>}
   */
  static findUnique(params) {
    return prisma.repository.findUnique(params);
  }

  /**
   * @param {RepositoryFindFirstArgs} params
   * @returns {Promise<Repository | null>}
   */
  static findFirst(params) {
    return prisma.repository.findFirst(params);
  }

  /**
   * @param {string} pattern
   * @returns {Promise<Repository | null>}
   */
  static findByPattern(pattern) {
    return prisma.repository.findUnique({ where: { pattern } });
  }

  /**
   * @param {RepositoryUpdateArgs} params
   * @returns {Promise<Repository>}
   */
  static async update(params) {
    const repository = await prisma.repository.update(params);
    triggerHooks('repository:update', repository);
    return repository;
  }

  /**
   *
   * @param {string} pattern
   * @param {string} institutionId
   */
  static async connectInstitution(pattern, institutionId) {
    const repository = await prisma.repository.update({
      where: { pattern },
      data: { institutions: { connect: { id: institutionId } } },
    });

    triggerHooks('repository:update', repository);

    return repository;
  }

  /**
   * @param {RepositoryUpsertArgs} params
   * @returns {Promise<Repository>}
   */
  static async upsert(params) {
    const repository = await prisma.repository.upsert(params);
    triggerHooks('repository:upsert', repository);
    return repository;
  }

  /**
   * @param {RepositoryDeleteArgs} params
   * @returns {Promise<Repository | null>}
   */
  static async delete(params) {
    const [deleteResult, deletedRepository] = await prisma.$transaction(async (tx) => {
      const repository = await tx.repository.findUnique({
        where: params.where,
        include: {
          permissions: true,
          institutions: true,
        },
      });

      if (!repository) {
        return [null, null];
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

    triggerHooks('repository:delete', deletedRepository);
    deletedRepository.permissions.forEach((repoPerm) => { triggerHooks('repository_permission:delete', repoPerm); });

    return deleteResult;
  }

  /**
   * Disconnect a repository from an institution and remove all associated permissions
   * @param {string} pattern
   * @param {string} institutionId
   * @returns {Promise<Repository | null>}
   */
  static async disconnectInstitution(pattern, institutionId) {
    const [newRepository, oldRepository] = await prisma.$transaction(async (tx) => {
      const currentRepository = await tx.repository.findUnique({
        where: { pattern },
        include: {
          permissions: { where: { institutionId } },
          institutions: { where: { id: institutionId } },
        },
      });

      if (!currentRepository) {
        return [null, null];
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

      return [
        updatedRepository,
        currentRepository,
      ];
    });

    if (!oldRepository) {
      return null;
    }

    triggerHooks('repository:disconnected', oldRepository, institutionId);
    oldRepository.permissions.forEach((repoPerm) => { triggerHooks('repository_permission:delete', repoPerm); });

    return newRepository;
  }

  /**
   * @returns {Promise<Array<Repository> | null>}
   */
  static async deleteAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const repositories = await this.findMany({});

    await Promise.all(repositories.map(async (repository) => {
      await this.delete({
        where: {
          pattern: repository.pattern,
        },
      });
    }));

    return repositories;
  }
};
