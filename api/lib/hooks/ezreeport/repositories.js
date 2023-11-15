// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const ezrReportingUsers = require('../../services/ezreeport/reportingUsers');

/**
 * @typedef {import('@prisma/client').Repository} Repository
 */

/**
 * @param { Repository } repository
 */
const onRepositoryModified = async (repository) => {
  if (!repository.institutionId) {
    return;
  }

  let username;
  try {
    username = (
      await ezrReportingUsers.upsertReportUserFromInstitutionId(repository.institutionId)
    )?.username;
    appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is upserted in elastic`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Reporting user [${username}] cannot be upserted in elastic:\n${error}`);
  }
};

/**
 * @param { Repository } repository
 */
const uniqueResolver = (repository) => repository.pattern;

registerHook('repository:create', onRepositoryModified, { debounce: true, uniqueResolver });
registerHook('repository:update', onRepositoryModified, { debounce: true, uniqueResolver });
registerHook('repository:upsert', onRepositoryModified, { debounce: true, uniqueResolver });
registerHook('repository:delete', onRepositoryModified, { debounce: true, uniqueResolver });
