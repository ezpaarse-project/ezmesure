// @ts-check
const institutionsPrisma = require('../services/prisma/institutions');

const { triggerHooks } = require('../hooks/hookEmitter');

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
    const institution = await institutionsPrisma.create(params);
    triggerHooks('institution:create', institution);
    return institution;
  }

  /**
   * @param {InstitutionCreateArgs} params
   * @returns {Promise<Institution>}
   */
  static async createAsUser(params) {
    const institution = await institutionsPrisma.create(params);
    triggerHooks('institution:create', institution);
    return institution;
  }

  /**
   * @param {InstitutionFindManyArgs} params
   * @returns {Promise<Institution[]>}
   */
  static findMany(params) {
    return institutionsPrisma.findMany(params);
  }

  /**
   * @param {InstitutionFindUniqueArgs} params
   * @returns {Promise<Institution | null>}
   */
  static findUnique(params) {
    return institutionsPrisma.findUnique(params);
  }

  /**
   * @param {string} id
   * @param {Object | null} includes
   * @returns {Promise<Institution | null>}
   */
  static findByID(id, includes = null) {
    return institutionsPrisma.findByID(id, includes);
  }

  /**
   * @param {InstitutionUpdateArgs} params
   * @returns {Promise<Institution>}
   */
  static async update(params) {
    const institution = await institutionsPrisma.update(params);
    triggerHooks('institution:update', institution);
    return institution;
  }

  /**
   * @param {string} institutionId
   * @param {string} subInstitutionId
   * @returns {Promise<Institution>}
   */
  static async addSubInstitution(institutionId, subInstitutionId) {
    const institution = await institutionsPrisma.addSubInstitution(institutionId, subInstitutionId);
    triggerHooks('institution:update', institution);
    return institution;
  }

  /**
   * @param {string} id
   * @returns {Promise<Institution>}
   */
  static async validate(id) {
    const institution = await institutionsPrisma.validate(id);
    triggerHooks('institution:update', institution);
    return institution;
  }

  /**
   * @param {InstitutionUpsertArgs} params
   * @returns {Promise<Institution>}
   */
  static async upsert(params) {
    const institution = await institutionsPrisma.upsert(params);
    triggerHooks('institution:upsert', institution);
    return institution;
  }

  /**
   * @param {InstitutionDeleteArgs} params
   * @returns {Promise<Institution | null>}
   */
  static async delete(params) {
    const data = await institutionsPrisma.remove(params);

    if (!data) return null;

    const {
      deletedInstitution,
      deletedRepos,
      institution,
    } = data;

    triggerHooks('institution:delete', institution);

    institution.memberships?.forEach((element) => {
      triggerHooks('memberships:delete', element);

      element.repositoryPermissions.forEach((repoPerm) => { triggerHooks('repository_permission:delete', repoPerm); });
      element.spacePermissions.forEach((spacePerm) => { triggerHooks('space_permission:delete', spacePerm); });
    });
    institution.spaces?.forEach((element) => { triggerHooks('space:delete', element); });
    deletedRepos.forEach((element) => { triggerHooks('repository:delete', element); });
    institution.sushiCredentials?.forEach((element) => { triggerHooks('sushi_credentials:delete', element); });

    return deletedInstitution;
  }

  /**
   * @returns {Promise<Object | null>}
   */
  static async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    const institutions = await this.findMany({});

    if (institutions.length === 0) { return null; }

    await Promise.all(institutions.map(async (institution) => {
      await this.delete({
        where: {
          id: institution.id,
        },
      });
    }));

    return institutions;
  }

  static async getContacts(institutionId) {
    return institutionsPrisma.getContacts(institutionId);
  }
};
