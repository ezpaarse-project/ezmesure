// @ts-check
const repositoriesPrisma = require('../services/prisma/repositories');
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
    const repository = await repositoriesPrisma.create(params);
    triggerHooks('repository:create', repository);
    return repository;
  }

  /**
   * @param {RepositoryFindManyArgs} params
   * @returns {Promise<Repository[]>}
   */
  static findMany(params) {
    return repositoriesPrisma.findMany(params);
  }

  /**
   * @param {RepositoryFindUniqueArgs} params
   * @returns {Promise<Repository | null>}
   */
  static findUnique(params) {
    return repositoriesPrisma.findUnique(params);
  }

  /**
   * @param {RepositoryFindFirstArgs} params
   * @returns {Promise<Repository | null>}
   */
  static findFirst(params) {
    return repositoriesPrisma.findFirst(params);
  }

  /**
   * @param {string} pattern
   * @returns {Promise<Repository | null>}
   */
  static findByPattern(pattern) {
    return repositoriesPrisma.findUnique({ where: { pattern } });
  }

  /**
   * @param {RepositoryUpdateArgs} params
   * @returns {Promise<Repository>}
   */
  static async update(params) {
    const repository = await repositoriesPrisma.update(params);
    triggerHooks('repository:update', repository);
    return repository;
  }

  /**
   *
   * @param {string} pattern
   * @param {string} institutionId
   */
  static async connectInstitution(pattern, institutionId) {
    const repository = await repositoriesPrisma.connectInstitution(pattern, institutionId);
    triggerHooks('repository:update', repository);
    return repository;
  }

  /**
   * @param {RepositoryUpsertArgs} params
   * @returns {Promise<Repository>}
   */
  static async upsert(params) {
    const repository = await repositoriesPrisma.upsert(params);
    triggerHooks('repository:upsert', repository);
    return repository;
  }

  /**
   * @param {RepositoryDeleteArgs} params
   * @returns {Promise<Repository | null>}
   */
  static async delete(params) {
    const result = await repositoriesPrisma.remove(params);
    if (!result) {
      return null;
    }
    const { deleteResult, deletedRepository } = result;

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
    const result = await repositoriesPrisma.disconnectInstitution(pattern, institutionId);
    if (!result) {
      return null;
    }
    const { newRepository, oldRepository } = result;

    triggerHooks('repository:disconnected', oldRepository, institutionId);
    oldRepository.permissions.forEach((repoPerm) => { triggerHooks('repository_permission:delete', repoPerm); });

    return newRepository;
  }

  /**
   * @returns {Promise<Array<Repository> | null>}
   */
  static async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    const repositories = await this.findMany({});

    if (repositories.length === 0) { return null; }

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
