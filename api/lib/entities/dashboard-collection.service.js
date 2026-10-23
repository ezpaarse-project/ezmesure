// @ts-check
const BasePrismaService = require('./base-prisma.service');
const dashboardCollectionsPrisma = require('../services/prisma/dashboard-collections');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').Space} Space */
/** @typedef {import('../.prisma/client.mts').SpaceDashboardCollection} SpaceDashboardCollection */
/** @typedef {import('../.prisma/client.mts').DashboardCollection} DashboardCollection */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionUpdateArgs} DashboardCollectionUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionUpsertArgs} DashboardCollectionUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionCountArgs} DashboardCollectionCountArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionFindUniqueArgs} DashboardCollectionFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionFindFirstArgs} DashboardCollectionFindFirstArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionFindManyArgs} DashboardCollectionFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionCreateArgs} DashboardCollectionCreateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCollectionDeleteArgs} DashboardCollectionDeleteArgs */
/**
 * @typedef {{
 *  collection: DashboardCollection
 *  spaceId: Space['id']
 *  repositoryPattern: SpaceDashboardCollection['repositoryPattern']
 * }} SpaceCollectionChangeHookPayload
 */
/* eslint-enable max-len */

module.exports = class RepositoriesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoriesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {DashboardCollectionCreateArgs} params
   * @returns {Promise<DashboardCollection>}
   */
  async create(params) {
    const collection = await dashboardCollectionsPrisma.create(params, this.prisma);
    this.triggerHooks('dashboard_collection:create', collection);
    return collection;
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
    const collection = await dashboardCollectionsPrisma.update(params, this.prisma);
    this.triggerHooks('dashboard_collection:update', collection);
    return collection;
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

    /** @type {SpaceCollectionChangeHookPayload} */
    const hookPayload = { collection, spaceId, repositoryPattern };
    this.triggerHooks('dashboard_collection:added_to_space', hookPayload);
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

    /** @type {SpaceCollectionChangeHookPayload} */
    const hookPayload = { collection, spaceId, repositoryPattern };
    this.triggerHooks('dashboard_collection:removed_from_space', hookPayload);
    return collection;
  }

  /**
   * @param {DashboardCollectionUpsertArgs} params
   * @returns {Promise<DashboardCollection>}
   */
  async upsert(params) {
    const collection = await dashboardCollectionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('dashboard_collection:upsert', collection);
    return collection;
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
