// @ts-check
const hookEmitter = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const {
  syncRepository,
  unmountRepository,
} = require('../../services/sync/elastic');

/**
 * @typedef {import('@prisma/client').Repository} Repository
 */

/**
 * @param { Repository } repository
 */
const onRepositoryUpsert = async (repository) => {
  try {
    await syncRepository(repository);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] Repository [${repository?.pattern}] could not be synchronized:\n${error}`,
    );
  }
};

/**
 * @param { Repository } repository
 */
const onRepositoryDelete = async (repository) => {
  try {
    await unmountRepository(repository);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] Repository [${repository?.pattern}] could not be unmounted:\n${error}`,
    );
  }
};

hookEmitter.on('repository:create', onRepositoryUpsert);
hookEmitter.on('repository:update', onRepositoryUpsert);
hookEmitter.on('repository:upsert', onRepositoryUpsert);
hookEmitter.on('repository:delete', onRepositoryDelete);
