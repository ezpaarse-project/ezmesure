// @ts-check
const hookEmitter = require('../_hookEmitter');

const { appLogger } = require('../../services/logger');

const { client: prisma } = require('../../services/prisma.service');
const elasticUsers = require('../../services/elastic/users');

const { generateRoleNameFromRepository } = require('./_utils');

/**
 * @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission
 */

/**
 * @param { RepositoryPermission } permission
 */
const onRepositoryPermissionUpsert = async (permission) => {
  let user;
  try {
    user = await elasticUsers.getUserByUsername(permission.username);
    if (!user) {
      throw new Error('User not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${permission.username}] cannot be getted: ${error.message}`);
    return;
  }

  let repository;
  try {
    repository = await prisma.repository.findUnique({
      where: { id: permission.repositoryId },
    });
    if (!repository) {
      throw new Error('Repository not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] Repository [${permission.repositoryId}] cannot be getted: ${error.message}`);
    return;
  }

  /** @type {{roles: string[]}} */
  let { roles } = user;
  const readonlyRole = generateRoleNameFromRepository(repository, 'readonly');
  const allRole = generateRoleNameFromRepository(repository, 'all');

  if (permission.readonly) {
    roles = roles.filter((r) => r !== allRole);
    roles.push(readonlyRole);
  } else {
    roles = roles.filter((r) => r !== readonlyRole);
    roles.push(allRole);
  }

  try {
    await elasticUsers.updateUser({
      username: permission.username,
      email: user.email,
      fullName: user.full_name,
      roles: [...new Set([...roles])],
    });
    appLogger.verbose(`[elastic][hooks] User [${permission.username}] is updated`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${permission.username}] cannot be updated: ${error.message}`);
  }
};

/**
 * @param { RepositoryPermission } permission
 */
const onRepositoryPermissionDelete = async (permission) => {
  let user;
  try {
    user = await elasticUsers.getUserByUsername(permission.username);
    if (!user) {
      throw new Error('User not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${permission.username}] cannot be getted: ${error.message}`);
    return;
  }

  let repository;
  try {
    repository = await prisma.repository.findUnique({
      where: { id: permission.repositoryId },
    });
    if (!repository) {
      throw new Error('Repository not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] Repository [${permission.repositoryId}] cannot be getted: ${error.message}`);
    return;
  }

  const oldRole = generateRoleNameFromRepository(repository, permission.readonly ? 'readonly' : 'all');
  const roles = user.roles.filter((r) => r !== oldRole);

  try {
    await elasticUsers.updateUser({
      username: permission.username,
      email: user.email,
      fullName: user.full_name,
      roles,
    });
    appLogger.verbose(`[elastic][hooks] User [${permission.username}] is updated`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${permission.username}] cannot be updated: ${error.message}`);
  }
};

hookEmitter.on('repository_permission:create', onRepositoryPermissionUpsert);
hookEmitter.on('repository_permission:update', onRepositoryPermissionUpsert);
hookEmitter.on('repository_permission:upsert', onRepositoryPermissionUpsert);
hookEmitter.on('repository_permission:delete', onRepositoryPermissionDelete);
