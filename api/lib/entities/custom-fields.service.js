// @ts-check

const BasePrismaService = require('./base-prisma.service');
const customFieldsPrisma = require('../services/prisma/custom-fields');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').CustomField} CustomField */
/** @typedef {import('../.prisma/client.mts').Prisma.CustomFieldUpdateArgs} CustomFieldUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.CustomFieldUpsertArgs} CustomFieldUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.CustomFieldCountArgs} CustomFieldCountArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.CustomFieldFindUniqueArgs} CustomFieldFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.CustomFieldFindManyArgs} CustomFieldFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.CustomFieldCreateArgs} CustomFieldCreateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.CustomFieldDeleteArgs} CustomFieldDeleteArgs */
/* eslint-enable max-len */

module.exports = class CustomFieldsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<CustomFieldsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {CustomFieldCreateArgs} params
   * @returns {Promise<CustomField>}
   */
  async create(params) {
    const customField = await customFieldsPrisma.create(params, this.prisma);
    this.triggerHooks('custom-field:create', customField);
    return customField;
  }

  /**
   * @param {CustomFieldFindManyArgs} params
   * @returns {Promise<CustomField[]>}
   */
  findMany(params) {
    return customFieldsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {CustomFieldFindUniqueArgs} params
   * @returns {Promise<CustomField | null>}
   */
  findUnique(params) {
    return customFieldsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {CustomFieldUpdateArgs} params
   * @returns {Promise<CustomField>}
   */
  async update(params) {
    const customField = await customFieldsPrisma.update(params, this.prisma);
    this.triggerHooks('custom-field:update', customField);
    return customField;
  }

  /**
   * @param {CustomFieldUpsertArgs} params
   * @returns {Promise<CustomField>}
   */
  async upsert(params) {
    const customField = await customFieldsPrisma.upsert(params, this.prisma);
    this.triggerHooks('custom-field:upsert', customField);
    return customField;
  }

  /**
   * @param {CustomFieldCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return customFieldsPrisma.count(params, this.prisma);
  }

  /**
   * @param {CustomFieldDeleteArgs} params
   * @returns {Promise<CustomField | null>}
   */
  async delete(params) {
    const customField = await customFieldsPrisma.remove(params, this.prisma);
    this.triggerHooks('custom-field:delete', customField);
    return customField;
  }
};
