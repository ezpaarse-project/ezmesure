// @ts-check
const { appLogger } = require('../services/logger');
const { client: prisma } = require('../services/prisma.service');
const ezreeport = require('../services/ezreeport');

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
  static async create(params) {
    const institution = await prisma.institution.create(params);

    if (institution.validated) {
      try {
        const { wasCreated } = await ezreeport.namespace.upsertFromInstitution(institution);
        appLogger.verbose(`[ezReeport] Created namespace [${institution.id}]`);
        if (!wasCreated) {
          appLogger.warn(`[ezReeport] Namespace [${institution.id}] was edited instead of being created`);
        }
      } catch (error) {
        appLogger.error(`[ezReeport] Cannot create namespace [${institution.id}]: ${error.message}`);
      }
    }

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

    if (institution.validated) {
      try {
        const { wasCreated } = await ezreeport.namespace.upsertFromInstitution(institution);
        appLogger.verbose(`[ezReeport] Edited namespace [${institution.id}]`);
        if (wasCreated) {
          appLogger.warn(`[ezReeport] Namespace [${institution.id}] was created instead of being edited`);
        }
      } catch (error) {
        appLogger.error(`[ezReeport] Cannot edit namespace [${institution.id}]: ${error.message}`);
      }
    } else {
      try {
        await ezreeport.namespace.deleteFromInstitution(institution);
        appLogger.verbose(`[ezReeport] Deleted namespace [${institution.id}]`);
      } catch (error) {
        appLogger.error(`[ezReeport] Cannot delete namespace [${institution.id}]: ${error.message}`);
      }
    }

    return institution;
  }

  /**
   * @param {InstitutionUpsertArgs} params
   * @returns {Promise<Institution>}
   */
  static async upsert(params) {
    const institution = await prisma.institution.upsert(params);

    if (institution.validated) {
      try {
        await ezreeport.namespace.upsertFromInstitution(institution);
        appLogger.verbose(`[ezReeport] Upserted namespace [${institution.id}]`);
      } catch (error) {
        appLogger.error(`[ezReeport] Cannot upsert namespace [${institution.id}]: ${error.message}`);
      }
    } else {
      try {
        await ezreeport.namespace.deleteFromInstitution(institution);
        appLogger.verbose(`[ezReeport] Deleted namespace [${institution.id}]`);
      } catch (error) {
        appLogger.error(`[ezReeport] Cannot delete namespace [${institution.id}]: ${error.message}`);
      }
    }

    return institution;
  }

  /**
   * @param {InstitutionDeleteArgs} params
   * @returns {Promise<Institution>}
   */
  static async delete(params) {
    const institution = await prisma.institution.delete(params);

    try {
      await ezreeport.namespace.deleteFromInstitution(institution);
    } catch (error) {
      appLogger.error(`[ezReeport] Cannot delete namespace [${institution.id}]: ${error.message}`);
    }

    return institution;
  }
};
