// @ts-check
const elasticUsers = require('../elastic/users');
const { client: prisma } = require('../prisma');
const { generateRoleNameFromRepository } = require('../../hooks/utils');

/** @typedef {import('@prisma/client').Institution} Institution */

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
 * @param {string[]} toDelete ids to to delete
 */
async function syncReportUsersFromInstitutions(toUpsert, toDelete) {
  const actions = [];

  // Mapping data to do only 1 upsert and 1 delete at the same time
  for (let i = 0; i < toUpsert.length; i += 1) {
    const institutionToUpsert = toUpsert[i];
    const idToDelete = toDelete[i];
    actions[i] = { institutionToUpsert, idToDelete };
  }

  let settled = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const { institutionToUpsert, idToDelete } of actions) {
    const promises = [];
    if (institutionToUpsert) {
      promises[0] = upsertReportUserFromInstitutionId(institutionToUpsert.id);
    }
    if (idToDelete) {
      const data = /** @type {Institution} */ ({ id: idToDelete });
      promises[1] = deleteReportUserFromInstitution(data);
    }
    settled = [
      ...settled,
      // eslint-disable-next-line no-await-in-loop
      (await Promise.allSettled(promises)),
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
