// @ts-check
const { client: prisma } = require('../services/prisma.service');
const hooks = require('../hooks');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Prisma.InstitutionUpdateArgs} InstitutionUpdateArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionUpsertArgs} InstitutionUpsertArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionFindUniqueArgs} InstitutionFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionFindManyArgs} InstitutionFindManyArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionCreateArgs} InstitutionCreateArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionDeleteArgs} InstitutionDeleteArgs
 */
/* eslint-enable max-len */

module.exports = class InstitutionsService {
  /**
   * @param {InstitutionCreateArgs} params
   * @returns {Promise<Institution>}
   */
  static async create(params) {
    const institution = await prisma.institution.create(params);

    hooks.emit('institution:create', institution, institution);

    return institution;
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
  static async update(params) {
    const institution = await prisma.institution.update(params);

    hooks.emit('institution:update', institution);

    return institution;
  }

  /**
   * @param {InstitutionUpsertArgs} params
   * @returns {Promise<Institution>}
   */
  static async upsert(params) {
    const institution = await prisma.institution.upsert(params);

    hooks.emit('institution:upsert', institution);

    return institution;
  }

  /**
   * @param {InstitutionDeleteArgs} params
   * @returns {Promise<Institution>}
   */
  static async delete(params) {
    const institution = await prisma.institution.delete(params);

    hooks.emit('institution:delete', institution);

    return institution;
  }
};
