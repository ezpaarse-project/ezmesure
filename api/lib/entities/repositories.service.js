// @ts-check
const BasePrismaService = require('./base-prisma.service');
const repositoriesPrisma = require('../services/prisma/repositories');

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

module.exports = class RepositoriesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoriesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {RepositoryCreateArgs} params
   * @returns {Promise<Repository>}
   */
  async create(params) {
    const repository = await repositoriesPrisma.create(params, this.prisma);
    this.triggerHooks('repository:create', repository);
    return repository;
  }

  /**
   * @param {RepositoryFindManyArgs} params
   * @returns {Promise<Repository[]>}
   */
  findMany(params) {
    return repositoriesPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {RepositoryFindUniqueArgs} params
   * @returns {Promise<Repository | null>}
   */
  findUnique(params) {
    return repositoriesPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {RepositoryFindFirstArgs} params
   * @returns {Promise<Repository | null>}
   */
  findFirst(params) {
    return repositoriesPrisma.findFirst(params, this.prisma);
  }

  /**
   * @param {string} pattern
   * @returns {Promise<Repository | null>}
   */
  findByPattern(pattern) {
    return repositoriesPrisma.findUnique({ where: { pattern } }, this.prisma);
  }

  /**
   * @param {RepositoryUpdateArgs} params
   * @returns {Promise<Repository>}
   */
  async update(params) {
    const repository = await repositoriesPrisma.update(params, this.prisma);
    this.triggerHooks('repository:update', repository);
    return repository;
  }

  /**
   *
   * @param {string} pattern
   * @param {string} institutionId
   */
  async connectInstitution(pattern, institutionId) {
    const repository = await repositoriesPrisma.connectInstitution(pattern, institutionId);
    this.triggerHooks('repository:update', repository);
    return repository;
  }

  /**
   * @param {RepositoryUpsertArgs} params
   * @returns {Promise<Repository>}
   */
  async upsert(params) {
    const repository = await repositoriesPrisma.upsert(params, this.prisma);
    this.triggerHooks('repository:upsert', repository);
    return repository;
  }

  /**
   * @param {RepositoryDeleteArgs} params
   * @returns {Promise<Repository | null>}
   */
  async delete(params) {
    const result = await repositoriesPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }
    const { deleteResult, deletedRepository } = result;

    this.triggerHooks('repository:delete', deletedRepository);
    deletedRepository.permissions.forEach((repoPerm) => { this.triggerHooks('repository_permission:delete', repoPerm); });

    return deleteResult;
  }

  /**
   * Disconnect a repository from an institution and remove all associated permissions
   * @param {string} pattern
   * @param {string} institutionId
   * @returns {Promise<Repository | null>}
   */
  async disconnectInstitution(pattern, institutionId) {
    const result = await repositoriesPrisma.disconnectInstitution(pattern, institutionId);
    if (!result) {
      return null;
    }
    const { newRepository, oldRepository } = result;

    this.triggerHooks('repository:disconnected', oldRepository, institutionId);
    oldRepository.permissions.forEach((repoPerm) => { this.triggerHooks('repository_permission:delete', repoPerm); });

    return newRepository;
  }

  /**
   * @returns {Promise<Array<Repository> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {RepositoriesService} service */
    const processor = async (service) => {
      const repositories = await service.findMany({});

      if (repositories.length === 0) { return null; }

      await Promise.all(
        repositories.map(
          (repository) => service.delete(
            { where: { pattern: repository.pattern } },
          ),
        ),
      );

      return repositories;
    };

    if (this.currentTransaction) {
      return processor(this);
    }
    return RepositoriesService.$transaction(processor);
  }
};
