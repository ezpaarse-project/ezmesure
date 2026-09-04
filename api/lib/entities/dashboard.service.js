// @ts-check
const BasePrismaService = require('./base-prisma.service');
const dashboardsPrisma = require('../services/prisma/dashboards');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').SpaceDashboardCollections} Dashboard */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardUpdateArgs} DashboardUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardUpsertArgs} DashboardUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCountArgs} DashboardCountArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardFindUniqueArgs} DashboardFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardFindFirstArgs} DashboardFindFirstArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardFindManyArgs} DashboardFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardCreateArgs} DashboardCreateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.DashboardDeleteArgs} DashboardDeleteArgs */
/* eslint-enable max-len */

module.exports = class RepositoriesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoriesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {DashboardCreateArgs} params
   * @returns {Promise<Dashboard>}
   */
  async create(params) {
    const dashboard = await dashboardsPrisma.create(params, this.prisma);
    this.triggerHooks('dashboard:create', dashboard);
    return dashboard;
  }

  /**
   * @param {DashboardFindManyArgs} params
   * @returns {Promise<Dashboard[]>}
   */
  findMany(params) {
    return dashboardsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {DashboardFindUniqueArgs} params
   * @returns {Promise<Dashboard | null>}
   */
  findUnique(params) {
    return dashboardsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {DashboardFindFirstArgs} params
   * @returns {Promise<Dashboard | null>}
   */
  findFirst(params) {
    return dashboardsPrisma.findFirst(params, this.prisma);
  }

  /**
   * @param {string} id
   * @returns {Promise<Dashboard | null>}
   */
  findById(id) {
    return dashboardsPrisma.findById(id, this.prisma);
  }

  /**
   * @param {DashboardUpdateArgs} params
   * @returns {Promise<Dashboard>}
   */
  async update(params) {
    const dashboard = await dashboardsPrisma.update(params, this.prisma);
    this.triggerHooks('dashboard:update', dashboard);
    return dashboard;
  }

  /**
   * @param {DashboardUpsertArgs} params
   * @returns {Promise<Dashboard>}
   */
  async upsert(params) {
    const dashboard = await dashboardsPrisma.upsert(params, this.prisma);
    this.triggerHooks('dashboard:upsert', dashboard);
    return dashboard;
  }

  /**
   * @param {DashboardCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return dashboardsPrisma.count(params, this.prisma);
  }

  /**
   * @param {DashboardDeleteArgs} params
   * @returns {Promise<Dashboard | null>}
   */
  async delete(params) {
    const result = await dashboardsPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }
    const { deleteResult, deletedDashboard } = result;

    this.triggerHooks('dashboard:delete', deletedDashboard);

    return deleteResult;
  }
};
