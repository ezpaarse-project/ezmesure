// @ts-check
const { client: prisma, Prisma } = require('./index');

const {
  PERMISSIONS,
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
} = require('../../entities/memberships.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Prisma.InstitutionUpdateArgs} InstitutionUpdateArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionUpsertArgs} InstitutionUpsertArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionFindUniqueArgs} InstitutionFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionFindManyArgs} InstitutionFindManyArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionCreateArgs} InstitutionCreateArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionDeleteArgs} InstitutionDeleteArgs
 *
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Repository} Repository
 * @typedef {import('@prisma/client').Space} Space
 * @typedef {import('@prisma/client').SushiCredentials} SushiCredentials
 * @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission
 * @typedef {import('@prisma/client').SpacePermission} SpacePermission
 *
 * @typedef {Repository & { institutions: Institution[] }} OldInstitutionRepository
 * @typedef {Membership & { repositoryPermissions: RepositoryPermission[], spacePermissions: SpacePermission[] }} OldInstitutionMembership
 * @typedef {Institution & { memberships: OldInstitutionMembership[], repositories: OldInstitutionRepository[], sushiCredentials: SushiCredentials[], spaces: Space[] }} OldInstitution
 * @typedef {{deletedInstitution: Institution, deletedRepos: Repository[], institution: OldInstitution }} InstitutionRemoved
 */
/* eslint-enable max-len */

/**
 * @param {InstitutionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution>}
 */
function create(params, tx = prisma) {
  return tx.institution.create(params);
}

/**
 * @param {Institution} institution
 * @param {string} username
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution>}
 */
function createAsUser(institution, username, tx = prisma) {
  return tx.institution.create({
    data: {
      ...institution,
      social: institution.social || Prisma.DbNull,
      memberships: {
        create: [{
          user: {
            connect: {
              username,
            },
          },
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
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution[]>}
 */
function findMany(params, tx = prisma) {
  return tx.institution.findMany(params);
}

/**
 * @param {InstitutionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.institution.findUnique(params);
}

/**
 * @param {string} id
 * @param {Object | null} includes
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution | null>}
 */
function findByID(id, includes = null, tx = prisma) {
  let include;
  if (includes) {
    include = {
      ...includes,
    };
  }
  return tx.institution.findUnique({
    where: { id },
    include,
  });
}

/**
 * @param {InstitutionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution>}
 */
function update(params, tx = prisma) {
  return tx.institution.update(params);
}

/**
 * @param {InstitutionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution>}
 */
function upsert(params, tx = prisma) {
  return tx.institution.upsert(params);
}

/**
 * @param {string} institutionId
 * @param {string} subInstitutionId
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution>}
 */
function addSubInstitution(institutionId, subInstitutionId, tx = prisma) {
  return tx.institution.update({
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
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution>}
 */
function validate(id, tx = prisma) {
  return tx.institution.update({
    where: { id },
    data: { validated: true },
  });
}

/**
 * @param {InstitutionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<InstitutionRemoved | null>}
 */
async function remove(params, tx) {
  /** @param {TransactionClient} txx */
  const processor = async (txx) => {
    const institution = await txx.institution.findUnique({
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

    await Promise.all(
      institution.repositories.map((r) => {
        // If last institution, delete repo
        if (r.institutions.length <= 1) {
          deletedRepos.push(r);
          return txx.repository.delete({ where: { pattern: r.pattern } });
        }

        // Otherwise disconnect institution from repo
        return txx.repository.update({
          where: { pattern: r.pattern },
          data: {
            institutions: {
              disconnect: { id: institution.id },
            },
          },
        });
      }),
    );

    return {
      deletedInstitution: await txx.institution.delete(params),
      deletedRepos,
      institution,
    };
  };

  let transactionResult;
  if (tx) {
    transactionResult = await processor(tx);
  } else {
    transactionResult = await prisma.$transaction(processor);
  }

  return transactionResult;
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Institution[] | null>}
 */
async function removeAll(tx = prisma) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const processor = async (txx) => {
    const institutions = await findMany({}, txx);

    if (institutions.length === 0) { return null; }

    await Promise.all(
      institutions.map(
        (institution) => remove(
          {
            where: {
              id: institution.id,
            },
          },
          txx,
        ),
      ),
    );

    return institutions;
  };

  if (tx) {
    return processor(tx);
  }
  return prisma.$transaction(processor);
}

/**
 * @param {string} institutionId
 * @param {TransactionClient} [tx]
 * @returns {Promise<Membership[]>}
 */
function getContacts(institutionId, tx = prisma) {
  return tx.membership.findMany({
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
