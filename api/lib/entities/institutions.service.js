// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');
const hooks = require('../hooks');

const {
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
} = require('./memberships.dto');

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
   * @param {string} id
   * @param {Object | null} includes
   * @returns {Promise<Institution | null>}
   */
  static findByID(id, includes = null) {
    let include;
    if (includes) {
      include = {
        ...includes,
      };
    }
    return prisma.institution.findUnique({
      where: { id },
      include,
    });
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
   * @param {string} institutionId
   * @param {string} subInstitutionId
   * @returns {Promise<Institution>}
   */
  static async addSubInstitution(institutionId, subInstitutionId) {
    const institution = await prisma.institution.update({
      where: { id: institutionId },
      include: { childInstitutions: true },
      data: {
        childInstitutions: {
          connect: { id: subInstitutionId },
        },
      },
    });

    hooks.emit('institution:update', institution);

    return institution;
  }

  /**
   * @param {string} id
   * @returns {Promise<Institution>}
   */
  static async validate(id) {
    const institution = await prisma.institution.update({
      where: { id },
      data: { validated: true },
    });

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
   * @returns {Promise<Institution | null>}
   */
  static async delete(params) {
    let institution;

    try {
      institution = await prisma.institution.delete(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }

    hooks.emit('institution:delete', institution);

    return institution;
  }

  /**
   * @returns {Promise<Object | null>}
   */
  static async deleteAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const institutions = await this.findMany({});

    hooks.emit('institution:deleteAll', institutions);

    await prisma.institution.deleteMany();

    return institutions;
  }

  static async getContacts(institutionId) {
    return prisma.membership.findMany({
      where: {
        institutionId,
        roles: {
          hasSome: [DOC_CONTACT, TECH_CONTACT],
        },
      },
      include: {
        user: true,
      },
    });
  }
};
