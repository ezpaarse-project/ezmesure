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

const hookOptions = { uniqueResolver: (repository) => repository.pattern };

registerHook('repository:create', onRepositoryModified, hookOptions);
registerHook('repository:update', onRepositoryModified, hookOptions);
registerHook('repository:upsert', onRepositoryModified, hookOptions);
registerHook('repository:delete', onRepositoryModified, hookOptions);
