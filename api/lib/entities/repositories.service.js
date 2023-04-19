// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Repository} Repository */
/** @typedef {import('@prisma/client').Prisma.RepositoryUpdateArgs} RepositoryUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryUpsertArgs} RepositoryUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryFindUniqueArgs} RepositoryFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryFindManyArgs} RepositoryFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryCreateArgs} RepositoryCreateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryDeleteArgs} RepositoryDeleteArgs */
/* eslint-enable max-len */

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

  /**
   * @param {RepositoryDeleteArgs} params
   * @returns {Promise<Repository | null>}
   */
  static delete(params) {
    return prisma.repository.delete(params).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    });
  }
};
