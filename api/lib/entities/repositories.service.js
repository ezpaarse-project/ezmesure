// @ts-check
const prisma = require('../services/prisma.service');

/** @typedef {import('@prisma/client').Repository} Repository */
/** @typedef {import('@prisma/client').Prisma.RepositoryUpdateArgs} RepositoryUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryUpsertArgs} RepositoryUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryFindUniqueArgs} RepositoryFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryFindManyArgs} RepositoryFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryCreateArgs} RepositoryCreateArgs */

module.exports = class RepositorysService {
  /**
   * @param {RepositoryCreateArgs} params
   * @returns {Promise<Repository>}
   */
  static create(params) {
    return prisma.repository.create(params);
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
   * @param {RepositoryUpdateArgs} params
   * @returns {Promise<Repository>}
   */
  static update(params) {
    return prisma.repository.update(params);
  }

  /**
   * @param {RepositoryUpsertArgs} params
   * @returns {Promise<Repository>}
   */
  static upsert(params) {
    return prisma.repository.upsert(params);
  }
};
