// @ts-check
const prisma = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Step} Step */
/** @typedef {import('@prisma/client').Prisma.StepUpdateArgs} StepUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.StepUpsertArgs} StepUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.StepFindUniqueArgs} StepFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.StepFindManyArgs} StepFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.StepCreateArgs} StepCreateArgs */
/* eslint-enable max-len */

module.exports = class StepsService {
  /**
   * @param {StepCreateArgs} params
   * @returns {Promise<Step>}
   */
  static create(params) {
    return prisma.step.create(params);
  }

  /**
   * @param {StepFindManyArgs} params
   * @returns {Promise<Step[]>}
   */
  static findMany(params) {
    return prisma.step.findMany(params);
  }

  /**
   * @param {StepFindUniqueArgs} params
   * @returns {Promise<Step | null>}
   */
  static findUnique(params) {
    return prisma.step.findUnique(params);
  }

  /**
   * @param {StepUpdateArgs} params
   * @returns {Promise<Step>}
   */
  static update(params) {
    return prisma.step.update(params);
  }

  /**
   * @param {StepUpsertArgs} params
   * @returns {Promise<Step>}
   */
  static upsert(params) {
    return prisma.step.upsert(params);
  }
};
