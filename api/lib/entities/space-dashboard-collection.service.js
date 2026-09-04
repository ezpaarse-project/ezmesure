// @ts-check
const BasePrismaService = require('./base-prisma.service');
const SpaceDashboardCollectionsPrisma = require('../services/prisma/space-dashboard-collections');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').SpaceDashboardCollection} SpaceDashboardCollection */
/** @typedef {import('../.prisma/client.mts').Prisma.SpaceDashboardCollectionUpdateArgs} SpaceDashboardCollectionUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.SpaceDashboardCollectionUpsertArgs} SpaceDashboardCollectionUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.SpaceDashboardCollectionCountArgs} SpaceDashboardCollectionCountArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.SpaceDashboardCollectionFindUniqueArgs} SpaceDashboardCollectionFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.SpaceDashboardCollectionFindFirstArgs} SpaceDashboardCollectionFindFirstArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.SpaceDashboardCollectionFindManyArgs} SpaceDashboardCollectionFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.SpaceDashboardCollectionCreateArgs} SpaceDashboardCollectionCreateArgs */
/* eslint-enable max-len */

module.exports = class RepositoriesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoriesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {SpaceDashboardCollectionCreateArgs} params
   * @returns {Promise<SpaceDashboardCollection>}
   */
  async create(params) {
    const dashboardCollection = await SpaceDashboardCollectionsPrisma.create(params, this.prisma);
    this.triggerHooks('dashboard_collection:create', dashboardCollection);
    return dashboardCollection;
  }

  /**
   * @param {SpaceDashboardCollectionFindManyArgs} params
   * @returns {Promise<SpaceDashboardCollection[]>}
   */
  findMany(params) {
    return SpaceDashboardCollectionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {SpaceDashboardCollectionFindUniqueArgs} params
   * @returns {Promise<SpaceDashboardCollection | null>}
   */
  findUnique(params) {
    return SpaceDashboardCollectionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {SpaceDashboardCollectionFindFirstArgs} params
   * @returns {Promise<SpaceDashboardCollection | null>}
   */
  findFirst(params) {
    return SpaceDashboardCollectionsPrisma.findFirst(params, this.prisma);
  }

  /**
   * @param {SpaceDashboardCollectionUpdateArgs} params
   * @returns {Promise<SpaceDashboardCollection>}
   */
  async update(params) {
    const dashboardCollection = await SpaceDashboardCollectionsPrisma.update(params, this.prisma);
    this.triggerHooks('dashboard_collection:update', dashboardCollection);
    return dashboardCollection;
  }

  /**
   * @param {SpaceDashboardCollectionUpsertArgs} params
   * @returns {Promise<SpaceDashboardCollection>}
   */
  async upsert(params) {
    const dashboardCollection = await SpaceDashboardCollectionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('dashboard_collection:upsert', dashboardCollection);
    return dashboardCollection;
  }

  /**
   * @param {SpaceDashboardCollectionCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return SpaceDashboardCollectionsPrisma.count(params, this.prisma);
  }
};
