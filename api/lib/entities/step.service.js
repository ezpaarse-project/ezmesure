// @ts-check
const BasePrismaService = require('./base-prisma.service');
const stepPrisma = require('../services/prisma/step');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Step} Step */
/** @typedef {import('@prisma/client').Prisma.StepUpdateArgs} StepUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.StepUpsertArgs} StepUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.StepFindUniqueArgs} StepFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.StepFindManyArgs} StepFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.StepCreateArgs} StepCreateArgs */
/* eslint-enable max-len */

module.exports = class StepsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<StepsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {StepCreateArgs} params
   * @returns {Promise<Step>}
   */
  create(params) {
    return stepPrisma.create(params, this.prisma);
  }

  /**
   * @param {StepFindManyArgs} params
   * @returns {Promise<Step[]>}
   */
  findMany(params) {
    return stepPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {StepFindUniqueArgs} params
   * @returns {Promise<Step | null>}
   */
  findUnique(params) {
    return stepPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {StepUpdateArgs} params
   * @returns {Promise<Step>}
   */
  update(params) {
    return stepPrisma.update(params, this.prisma);
  }

  /**
   * @param {StepUpsertArgs} params
   * @returns {Promise<Step>}
   */
  upsert(params) {
    return stepPrisma.upsert(params, this.prisma);
  }
};
