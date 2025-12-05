// @ts-check
const elasticUsers = require('../elastic/users');
const { client: prisma } = require('../prisma');
const { generateRoleNameFromRepository } = require('../../hooks/utils');

/** @typedef {import('../../.prisma/client.mjs').Institution} Institution */

/**
 * @param {Institution} institution
 */
const getReportUserFromInstitution = (institution) => ({
  username: `report.${institution.id}`,
  email: '',
  fullName: `Reporting ${institution.acronym || institution.name || institution.id}`,
});

/**
 * Upsert user used for reporting in Elastic
 *
 * @param {string} id
 *
 * @returns The elastic user
 */
async function upsertReportUserFromInstitutionId(id) {
  const institution = await prisma.institution.findUnique({
    where: {
      id,
    },
    include: {
      repositories: true,
    },
  });

  if (!institution) {
    throw new Error('Not found');
  }

  const roles = institution.repositories.map((repository) => generateRoleNameFromRepository(repository, 'readonly'));

  const user = {
    ...getReportUserFromInstitution(institution),
    roles,
  };

  const isUserExist = await elasticUsers.getUserByUsername(user.username);
  if (isUserExist) {
    await elasticUsers.updateUser(user);
  } else {
    await elasticUsers.createUser(user);
  }
  return user;
}

/**
 * Upsert user used for reporting in Elastic
 *
 * @param {Institution} institution
 *
 * @returns The reporting user
 */
async function deleteReportUserFromInstitution(institution) {
  const user = getReportUserFromInstitution(institution);
  await elasticUsers.deleteUser(user.username);
  return user;
}

/**
 * Sync users used for reporting in Elastic
 *
 * @param {Institution[]} toUpsert institutions to upsert
 */
async function syncReportUsersFromInstitutions(toUpsert) {
  let settled = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const institutionToUpsert of toUpsert) {
    const promise = upsertReportUserFromInstitutionId(institutionToUpsert.id);
    settled = [
      ...settled,
      // eslint-disable-next-line no-await-in-loop
      await promise,
    ];
  }

  return settled.reduce(
    (prev, [upsertResult, deleteResult]) => ({
      upserted: prev.upserted + (upsertResult?.status === 'fulfilled'),
      deleted: prev.deleted + (deleteResult?.status === 'fulfilled'),
    }),
    {
      upserted: 0,
      deleted: 0,
    },
  );
}

module.exports = {
  getReportUserFromInstitution,
  deleteReportUserFromInstitution,
  upsertReportUserFromInstitutionId,
  syncReportUsersFromInstitutions,
};
