// @ts-check
const { client: prisma } = require('../services/prisma.service');
const { triggerHooks } = require('../hooks/hookEmitter');

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

    triggerHooks('institution:create', institution);

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

    triggerHooks('institution:update', institution);

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

    triggerHooks('institution:update', institution);

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

    triggerHooks('institution:update', institution);

    return institution;
  }

  /**
   * @param {InstitutionUpsertArgs} params
   * @returns {Promise<Institution>}
   */
  static async upsert(params) {
    const institution = await prisma.institution.upsert(params);

    triggerHooks('institution:upsert', institution);

    return institution;
  }

  /**
   * @param {InstitutionDeleteArgs} params
   * @returns {Promise<Institution | null>}
   */
  static async delete(params) {
    const transactionResult = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.findUnique({
        where: params.where,
        include: {
          memberships: {
            include: {
              repositoryPermissions: true,
              spacePermissions: true,
            },
          },
          spaces: true,
          repositories: { include: { institutions: true } },
          sushiCredentials: true,
        },
      });

      if (!institution) {
        return null;
      }

      const deletedRepos = [];
      const findArgs = { where: { institutionId: institution.id } };

      await tx.repositoryPermission.deleteMany(findArgs);
      await tx.spacePermission.deleteMany(findArgs);
      await tx.membership.deleteMany(findArgs);

      await Promise.all(
        institution.repositories.map((r) => {
          // If last institution, delete repo
          if (r.institutions.length <= 1) {
            deletedRepos.push(r);
            return tx.repository.delete({ where: { pattern: r.pattern } });
          }

          // Otherwise disconnect institution from repo
          return tx.repository.update({
            where: { pattern: r.pattern },
            data: {
              institutions: {
                disconnect: { id: institution.id },
              },
            },
          });
        }),
      );
      await tx.space.deleteMany(findArgs);

      await tx.sushiCredentials.deleteMany(findArgs);

      return {
        deletedInstitution: await tx.institution.delete(params),
        deletedRepos,
        institution,
      };
    });

    if (!transactionResult) {
      return null;
    }

    const {
      deletedInstitution,
      deletedRepos,
      institution,
    } = transactionResult;

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
  static async deleteAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const institutions = await this.findMany({});

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
