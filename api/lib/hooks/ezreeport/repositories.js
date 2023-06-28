// @ts-check
const hookEmitter = require('../hookEmitter');

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
    username = (await ezrReportingUsers.upsertReportUserFromInstitution({
      id: repository.institutionId,
    }))?.username;
    appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is upserted in elastic`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Reporting user [${username}] cannot be upserted in elastic:\n${error}`);
  }
};

hookEmitter.on('repository:create', onRepositoryModified);
hookEmitter.on('repository:update', onRepositoryModified);
hookEmitter.on('repository:upsert', onRepositoryModified);
hookEmitter.on('repository:delete', onRepositoryModified);
