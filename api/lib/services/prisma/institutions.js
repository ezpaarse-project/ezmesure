// @ts-check
const { client: prisma } = require('./index');

const {
  PERMISSIONS,
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
} = require('../../entities/memberships.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Repository} Repository
 * @typedef {import('@prisma/client').Prisma.InstitutionUpdateArgs} InstitutionUpdateArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionUpsertArgs} InstitutionUpsertArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionFindUniqueArgs} InstitutionFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionFindManyArgs} InstitutionFindManyArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionCreateArgs} InstitutionCreateArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionDeleteArgs} InstitutionDeleteArgs
 * @typedef {{deletedInstitution: Institution, deletedRepos: Repository[], institution: Institution }} InstitutionRemoved
 * @returns {Promise<RemoveInstitution | null>}
 */
/* eslint-enable max-len */

/**
 * @param {InstitutionCreateArgs} params
 * @returns {Promise<Institution>}
 */
function create(params) {
  return prisma.institution.create(params);
}

/**
 * @param {Institution} institution
 * @param {string} username
 * @returns {Promise<Institution>}
 */
function createAsUser(institution, username) {
  return prisma.institution.create({
    data: {
      ...institution,
      memberships: {
        create: [{
          username,
          permissions: [...PERMISSIONS],
          roles: [DOC_CONTACT, TECH_CONTACT],
          locked: true,
        }],
      },
    },

  });
}

/**
 * @param {InstitutionFindManyArgs} params
 * @returns {Promise<Institution[]>}
 */
function findMany(params) {
  return prisma.institution.findMany(params);
}

/**
 * @param {InstitutionFindUniqueArgs} params
 * @returns {Promise<Institution | null>}
 */
function findUnique(params) {
  return prisma.institution.findUnique(params);
}

/**
 * @param {string} id
 * @param {Object | null} includes
 * @returns {Promise<Institution | null>}
 */
function findByID(id, includes = null) {
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
function update(params) {
  return prisma.institution.update(params);
}

/**
 * @param {InstitutionUpsertArgs} params
 * @returns {Promise<Institution>}
 */
function upsert(params) {
  return prisma.institution.upsert(params);
}

/**
 * @param {string} institutionId
 * @param {string} subInstitutionId
 * @returns {Promise<Institution>}
 */
function addSubInstitution(institutionId, subInstitutionId) {
  return prisma.institution.update({
    where: { id: institutionId },
    include: { childInstitutions: true },
    data: {
      childInstitutions: {
        connect: { id: subInstitutionId },
      },
    },
  });
}

/**
 * @param {string} id
 * @returns {Promise<Institution>}
 */
function validate(id) {
  return prisma.institution.update({
    where: { id },
    data: { validated: true },
  });
}

/**
 * @param {InstitutionDeleteArgs} params
 * @returns {Promise<InstitutionRemoved | null>}
 */
async function remove(params) {
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

  return transactionResult;
}

/**
 * @returns {Promise<Institution[] | null>}
 */
async function removeAll() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  const institutions = await findMany({});

  if (institutions.length === 0) { return null; }

  await Promise.all(institutions.map(async (institution) => {
    await remove({
      where: {
        id: institution.id,
      },
    });
  }));

  return institutions;
}

/**
 * @returns {Promise<Membership[]>}
 */
function getContacts(institutionId) {
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

module.exports = {
  create,
  createAsUser,
  findMany,
  findUnique,
  findByID,
  update,
  upsert,
  addSubInstitution,
  validate,
  remove,
  removeAll,
  getContacts,
};
