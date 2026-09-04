// @ts-check
const BasePrismaService = require('./base-prisma.service');
const dashboardCollectionsPrisma = require('../services/prisma/dashboard-collections');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').DashboardCollection} DashboardCollection */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionUpdateArgs} DashboardCollectionUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionUpsertArgs} DashboardCollectionUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionCountArgs} DashboardCollectionCountArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionFindUniqueArgs} DashboardCollectionFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionFindFirstArgs} DashboardCollectionFindFirstArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionFindManyArgs} DashboardCollectionFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionCreateArgs} DashboardCollectionCreateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionDeleteArgs} DashboardCollectionDeleteArgs */
/* eslint-enable max-len */

module.exports = class RepositoriesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoriesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {DashboardCollectionCreateArgs} params
   * @returns {Promise<DashboardCollection>}
   */
  async create(params) {
    const repositoryAlias = await dashboardCollectionsPrisma.create(params, this.prisma);
    this.triggerHooks('dashboard_collection:create', repositoryAlias);
    return repositoryAlias;
  }

  /**
   * @param {DashboardCollectionFindManyArgs} params
   * @returns {Promise<DashboardCollection[]>}
   */
  findMany(params) {
    return dashboardCollectionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {DashboardCollectionFindUniqueArgs} params
   * @returns {Promise<DashboardCollection | null>}
   */
  findUnique(params) {
    return dashboardCollectionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {DashboardCollectionFindFirstArgs} params
   * @returns {Promise<DashboardCollection | null>}
   */
  findFirst(params) {
    return dashboardCollectionsPrisma.findFirst(params, this.prisma);
  }

  /**
   * @param {string} id
   * @returns {Promise<DashboardCollection | null>}
   */
  findById(id) {
    return dashboardCollectionsPrisma.findUnique({ where: { id } }, this.prisma);
  }

  /**
   * @param {DashboardCollectionUpdateArgs} params
   * @returns {Promise<DashboardCollection>}
   */
  async update(params) {
    const repositoryAlias = await dashboardCollectionsPrisma.update(params, this.prisma);
    this.triggerHooks('dashboard_collection:update', repositoryAlias);
    return repositoryAlias;
  }

  /**
   *
   * @param {string} collectionId
   * @param {string} spaceId
   * @param {string} repositoryPattern
   */
  async addToSpace(collectionId, spaceId, repositoryPattern) {
    const collection = await dashboardCollectionsPrisma.addToSpace(
      collectionId,
      spaceId,
      repositoryPattern,
    );
    this.triggerHooks('dashboard_collection:added_to_space', collection);
    return collection;
  }

  /**
   *
   * @param {string} collectionId
   * @param {string} spaceId
   * @param {string} repositoryPattern
   */
  async removeFromSpace(collectionId, spaceId, repositoryPattern) {
    const collection = await dashboardCollectionsPrisma.removeFromSpace(
      collectionId,
      spaceId,
      repositoryPattern,
    );
    this.triggerHooks('dashboard_collection:removed_from_space', collection);
    return collection;
  }

  /**
   * @param {DashboardCollectionUpsertArgs} params
   * @returns {Promise<DashboardCollection>}
   */
  async upsert(params) {
    const repositoryAlias = await dashboardCollectionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('dashboard_collection:upsert', repositoryAlias);
    return repositoryAlias;
  }

  /**
   * @param {DashboardCollectionCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return dashboardCollectionsPrisma.count(params, this.prisma);
  }

  /**
   * @param {DashboardCollectionDeleteArgs} params
   * @returns {Promise<DashboardCollection | null>}
   */
  async delete(params) {
    const result = await dashboardCollectionsPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }
    const { deleteResult, deletedDashboardCollection } = result;

    this.triggerHooks('dashboard_collection:delete', deletedDashboardCollection);

    return deleteResult;
  }
};
