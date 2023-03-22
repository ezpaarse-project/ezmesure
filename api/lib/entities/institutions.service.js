// @ts-check
const { client: prisma } = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Institution} Institution */
/** @typedef {import('@prisma/client').Prisma.InstitutionUpdateArgs} InstitutionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.InstitutionUpsertArgs} InstitutionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.InstitutionFindUniqueArgs} InstitutionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.InstitutionFindManyArgs} InstitutionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.InstitutionCreateArgs} InstitutionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.InstitutionDeleteArgs} InstitutionDeleteArgs */
/* eslint-enable max-len */

module.exports = class InstitutionsService {
  /**
   * @param {InstitutionCreateArgs} params
   * @returns {Promise<Institution>}
   */
  static create(params) {
    return prisma.institution.create(params);
  }

  /**
   * @param {InstitutionFindManyArgs} params
   * @returns {Promise<Institution[]>}
   */
  static findMany(params) {
    return prisma.institution.findMany(params);
  }

  /**
   * @param {InstitutionFindUniqueArgs} params
   * @returns {Promise<Institution | null>}
   */
  static findUnique(params) {
    return prisma.institution.findUnique(params);
  }

  /**
   * @param {InstitutionUpdateArgs} params
   * @returns {Promise<Institution>}
   */
  static update(params) {
    return prisma.institution.update(params);
  }

  /**
   * @param {InstitutionUpsertArgs} params
   * @returns {Promise<Institution>}
   */
  static upsert(params) {
    return prisma.institution.upsert(params);
  }

  /**
   * @param {InstitutionDeleteArgs} params
   * @returns {Promise<Institution>}
   */
  static delete(params) {
    return prisma.institution.delete(params);
  }
};
