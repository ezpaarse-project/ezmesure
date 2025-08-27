// @ts-check
const { createHash } = require('node:crypto');

const BasePrismaService = require('./base-prisma.service');
const apiKeyPrisma = require('../services/prisma/api-key');

/* eslint-disable max-len */
/**
  @typedef {import('@prisma/client').ApiKey} ApiKey
  @typedef {import('@prisma/client').Prisma.ApiKeyUpdateArgs} ApiKeyUpdateArgs
  @typedef {import('@prisma/client').Prisma.ApiKeyUpsertArgs} ApiKeyUpsertArgs
  @typedef {import('@prisma/client').Prisma.ApiKeyFindUniqueArgs} ApiKeyFindUniqueArgs
  @typedef {import('@prisma/client').Prisma.ApiKeyFindManyArgs} ApiKeyFindManyArgs
  @typedef {import('@prisma/client').Prisma.ApiKeyCreateArgs} ApiKeyCreateArgs
  @typedef {import('@prisma/client').Prisma.ApiKeyDeleteArgs} ApiKeyDeleteArgs
  @typedef {import('@prisma/client').Prisma.ApiKeyCountArgs} ApiKeyCountArgs
  @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionDeleteManyArgs} ApiKeyRepositoryPermissionDeleteManyArgs
  @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryAliasPermissionDeleteManyArgs} ApiKeyRepositoryAliasPermissionDeleteManyArgs
*/
/* eslint-enable max-len */

module.exports = class ApiKeysService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<ApiKeysService>} */
  static $transaction = super.$transaction;

  /**
   * @param {string} value - Value of API Key
   */
  static getHashValue(value) {
    return createHash('sha-256')
      .update(value)
      .digest('hex');
  }

  /**
   * @param {ApiKeyCreateArgs} params
   * @returns {Promise<ApiKey>}
   */
  async create(params) {
    const apiKey = await apiKeyPrisma.create(params, this.prisma);
    this.triggerHooks('api-key:create', apiKey);
    return apiKey;
  }

  /**
   * @param {ApiKeyFindManyArgs} params
   * @returns {Promise<ApiKey[]>}
   */
  findMany(params) {
    return apiKeyPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {ApiKeyFindUniqueArgs} params
   * @returns {Promise<ApiKey | null>}
   */
  findUnique(params) {
    return apiKeyPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {ApiKeyUpdateArgs} params
   * @returns {Promise<ApiKey>}
   */
  async update(params) {
    const apiKey = await apiKeyPrisma.update(params, this.prisma);
    this.triggerHooks('api-key:update', apiKey);
    return apiKey;
  }

  /**
   * @param {ApiKeyUpsertArgs} params
   * @returns {Promise<ApiKey>}
   */
  async upsert(params) {
    const apiKey = await apiKeyPrisma.upsert(params, this.prisma);
    this.triggerHooks('api-key:upsert', apiKey);
    return apiKey;
  }

  /**
   * @param {ApiKeyCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return apiKeyPrisma.count(params, this.prisma);
  }

  /**
   * @param {ApiKeyDeleteArgs} params
   * @returns {Promise<ApiKey | null>}
   */
  async delete(params) {
    const result = await apiKeyPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }

    this.triggerHooks('api-key:delete', result);
    return result;
  }
};
