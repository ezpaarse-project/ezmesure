// @ts-check
const hookEmitter = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticRoles = require('../../services/elastic/roles');

const { generateRoleNameFromRepository } = require('../utils');

/**
 * @typedef {import('@prisma/client').Repository} Repository
 */

/**
 * @param { Repository } repository
 */
const onRepositoryUpsert = async (repository) => {
  const readOnlyRole = generateRoleNameFromRepository(repository, 'readonly');
  const allRole = generateRoleNameFromRepository(repository, 'all');
  try {
    await elasticRoles.upsertRole(readOnlyRole, [repository?.pattern], ['read', 'view_index_metadata']);
    appLogger.verbose(`[elastic][hooks] Role [${readOnlyRole}] is upserted`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] Role [${readOnlyRole}] cannot be upserted:\n${error}`);
  }

  try {
    await elasticRoles.upsertRole(allRole, [repository.pattern], ['all']);
    appLogger.verbose(`[elastic][hooks] Role [${allRole}] is upserted`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] Role [${allRole}] cannot be upserted:\n${error}`);
  }
};

/**
 * @param { Repository } repository
 */
const onRepositoryDelete = async (repository) => {
  const readOnlyRole = generateRoleNameFromRepository(repository, 'readonly');
  const allRole = generateRoleNameFromRepository(repository, 'all');
  try {
    await elasticRoles.deleteRole(readOnlyRole);
    appLogger.verbose(`[elastic][hooks] Role [${readOnlyRole}] is deleted`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] Role [${readOnlyRole}] cannot be deleted:\n${error}`);
  }

  try {
    await elasticRoles.deleteRole(allRole);
    appLogger.verbose(`[elastic][hooks] Role [${allRole}] is deleted`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] Role [${allRole}] cannot be deleted:\n${error}`);
  }
};

hookEmitter.on('repository:create', onRepositoryUpsert);
hookEmitter.on('repository:update', onRepositoryUpsert);
hookEmitter.on('repository:upsert', onRepositoryUpsert);
hookEmitter.on('repository:delete', onRepositoryDelete);
