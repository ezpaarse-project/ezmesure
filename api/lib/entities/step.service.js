// @ts-check
const stepPrisma = require('../services/prisma/step');

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
    return stepPrisma.create(params);
  }

  /**
   * @param {StepFindManyArgs} params
   * @returns {Promise<Step[]>}
   */
  static findMany(params) {
    return stepPrisma.findMany(params);
  }

  /**
   * @param {StepFindUniqueArgs} params
   * @returns {Promise<Step | null>}
   */
  static findUnique(params) {
    return stepPrisma.findUnique(params);
  }

  /**
   * @param {StepUpdateArgs} params
   * @returns {Promise<Step>}
   */
  static update(params) {
    return stepPrisma.update(params);
  }

  /**
   * @param {StepUpsertArgs} params
   * @returns {Promise<Step>}
   */
  static upsert(params) {
    return stepPrisma.upsert(params);
  }
};
