// @ts-check
const { client: prisma } = require('../services/prisma.service');
const ezreeport = require('../services/ezreeport');

/* eslint-disable max-len */
/** @typedef {Map<'ezreeport', true | Error>} SyncMap Key is the service, value is `true` if synced, an error is not */
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
   * @returns {Promise<{ data: Institution, syncMap: SyncMap }>}
   */
  static async create(params) {
    const institution = await prisma.institution.create(params);

    /** @type {SyncMap} */
    const syncMap = new Map();
    if (institution.validated) {
      try {
        await ezreeport.namespace.upsertFromInstitution(institution);
        syncMap.set('ezreeport', true);
      } catch (error) {
        syncMap.set('ezreeport', error);
      }
    }

    return {
      data: institution,
      syncMap,
    };
  }

  /**
   * @param {InstitutionFindManyArgs} params
   * @returns {Promise<{ data: Institution[] }>}
   */
  static async findMany(params) {
    return { data: await prisma.institution.findMany(params) };
  }

  /**
   * @param {InstitutionFindUniqueArgs} params
   * @returns {Promise<{ data: Institution | null }>}
   */
  static async findUnique(params) {
    return { data: await prisma.institution.findUnique(params) };
  }

  /**
   * @param {InstitutionUpdateArgs} params
   * @returns {Promise<{ data: Institution, syncMap: SyncMap }>}
   */
  static async update(params) {
    const institution = await prisma.institution.update(params);

    /** @type {SyncMap} */
    const syncMap = new Map();
    if (institution.validated) {
      try {
        await ezreeport.namespace.upsertFromInstitution(institution);
        syncMap.set('ezreeport', true);
      } catch (error) {
        syncMap.set('ezreeport', error);
      }
    } else {
      try {
        await ezreeport.namespace.deleteFromInstitution(institution);
        syncMap.set('ezreeport', true);
      } catch (error) {
        syncMap.set('ezreeport', error);
      }
    }

    return {
      data: institution,
      syncMap,
    };
  }

  /**
   * @param {InstitutionUpsertArgs} params
   * @returns {Promise<{ data: Institution, syncMap: SyncMap }>}
   */
  static async upsert(params) {
    const institution = await prisma.institution.upsert(params);

    /** @type {SyncMap} */
    const syncMap = new Map();
    if (institution.validated) {
      try {
        await ezreeport.namespace.upsertFromInstitution(institution);
        syncMap.set('ezreeport', true);
      } catch (error) {
        syncMap.set('ezreeport', error);
      }
    } else {
      try {
        await ezreeport.namespace.deleteFromInstitution(institution);
        syncMap.set('ezreeport', true);
      } catch (error) {
        syncMap.set('ezreeport', error);
      }
    }

    return {
      data: institution,
      syncMap,
    };
  }

  /**
   * @param {InstitutionDeleteArgs} params
   * @returns {Promise<{ data: Institution, syncMap: SyncMap }>}
   */
  static async delete(params) {
    const institution = await prisma.institution.delete(params);

    /** @type {SyncMap} */
    const syncMap = new Map();
    try {
      await ezreeport.namespace.deleteFromInstitution(institution);
      syncMap.set('ezreeport', true);
    } catch (error) {
      syncMap.set('ezreeport', error);
    }

    return {
      data: institution,
      syncMap,
    };
  }
};
