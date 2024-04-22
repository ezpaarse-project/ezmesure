// @ts-check
const BasePrismaService = require('./base-prisma.service');
const logPrisma = require('../services/prisma/log');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Log} Log */
/** @typedef {import('@prisma/client').Prisma.LogUpdateArgs} LogUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.LogUpsertArgs} LogUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.LogFindUniqueArgs} LogFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.LogFindManyArgs} LogFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.LogCreateArgs} LogCreateArgs */
/** @typedef {import('@prisma/client').Prisma.LogCountArgs} LogCountArgs */
/* eslint-enable max-len */

module.exports = class LogsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<LogsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {LogCreateArgs} params
   * @returns {Promise<Log>}
   */
  create(params) {
    return logPrisma.create(params, this.prisma);
  }

  /**
   * @param {LogFindManyArgs} params
   * @returns {Promise<Log[]>}
   */
  findMany(params) {
    return logPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {LogFindUniqueArgs} params
   * @returns {Promise<Log | null>}
   */
  findUnique(params) {
    return logPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {LogUpdateArgs} params
   * @returns {Promise<Log>}
   */
  update(params) {
    return logPrisma.update(params, this.prisma);
  }

  /**
   * @param {LogUpsertArgs} params
   * @returns {Promise<Log>}
   */
  upsert(params) {
    return logPrisma.upsert(params, this.prisma);
  }

  /**
   * @param {LogCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return logPrisma.count(params, this.prisma);
  }

  /**
   * @param {string} jobId - identifier of the associated harvest job
   * @param {string} level - log level
   * @param {string} message - log message
   * @returns {Promise<Log>}
   */
  log(jobId, level, message) {
    return logPrisma.log(jobId, level, message, this.prisma);
  }
};
