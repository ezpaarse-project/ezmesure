// @ts-check
const hookEmitter = require('./_hookEmitter');

const { appLogger } = require('../services/logger');

const { client: prisma } = require('../services/prisma.service');

const elasticUsers = require('../services/elastic/users');
const elasticRoles = require('../services/elastic/roles');
const kibana = require('../services/kibana');

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Repository} Repository
 * @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission
 * @typedef {import('@prisma/client').Space} Space
 */

// #region Users

/**
 * @param {User} user
 */
const onAdminUserCreate = async (user) => {
  try {
    await elasticUsers.createAdmin();
    appLogger.verbose(`[elastic][hooks] Admin user [${user.username}] is created`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] Admin user [${user.username}] cannot be created: ${error.message}`);
  }
};

/**
 * @param {User} user
 */
const onUserCreate = async (user) => {
  try {
    await elasticUsers.createUser({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: [],
    });
    appLogger.verbose(`[elastic][hooks] User [${user.username}] is created`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be created: ${error.message}`);
  }
};

/**
 * @param {User} user
 */
const onUserUpdate = async (user) => {
  let elasticUser;
  try {
    elasticUser = await elasticUsers.getUserByUsername(user.username);
    if (!elasticUser) {
      throw new Error('User not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be getted: ${error.message}`);
    return;
  }

  try {
    await elasticUsers.updateUser({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: elasticUser.roles,
    });
    appLogger.verbose(`[elastic][hooks] User [${user.username}] is updated`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be updated: ${error.message}`);
  }
};

/**
 * @param {User} user
 */
const onUserDelete = async (user) => {
  try {
    await elasticUsers.deleteUser(user.username);
    appLogger.verbose(`[elastic][hooks] User [${user.username}] is deleted`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be deleted: ${error.message}`);
  }
};

/**
 * @param {User} user
 */
const onUserUpsert = async (user) => {
  try {
    // Using events of THIS event handler (not the whole bus)
    if (await elasticUsers.getUserByUsername(user.username)) {
      return onUserUpdate(user);
    }

    return onUserCreate(user);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be upserted: ${error.message}`);
  }
};

hookEmitter.on('user:create-admin', onAdminUserCreate);
hookEmitter.on('user:create', onUserCreate);
hookEmitter.on('user:update', onUserUpdate);
hookEmitter.on('user:upsert', onUserUpsert);
hookEmitter.on('user:delete', onUserDelete);

// #endregion Users

// #region Memberships

// /**
//  * @param {Membership} membership
//  */
// const onMembershipCreate = async (membership) => {};

// /**
//  * @param {Membership} membership
//  */
// const onMembershipUpdate = async (membership) => {};

// /**
//  * @param {Membership} membership
// */
// const onMembershipDelete = async (membership) => {};

// /**
//  * @param {Membership} membership
//  */
// const onMembershipUpsert = async (membership) => {};

// elasticEmitter.on('membership:create', onMembershipCreate);
// elasticEmitter.on('membership:update', onMembershipUpdate);
// elasticEmitter.on('membership:upsert', onMembershipUpsert);
// elasticEmitter.on('membership:delete', onMembershipDelete);

// #endregion Memberships

// #region Institutions

// /**
//  * @param {Institution} institution
//  */
// const onInstitutionCreate = async (institution) => {};

// /**
//  * @param {Institution} institution
//  */
// const onInstitutionUpdate = async (institution) => {};

// /**
//  * @param {Institution} institution
// */
// const onInstitutionDelete = async (institution) => {};

// /**
//  * @param {Institution} institution
//  */
// const onInstitutionUpsert = async (institution) => {};

// elasticEmitter.on('institution:create', onInstitutionCreate);
// elasticEmitter.on('institution:update', onInstitutionUpdate);
// elasticEmitter.on('institution:upsert', onInstitutionUpsert);
// elasticEmitter.on('institution:delete', onInstitutionDelete);

// #endregion Institutions

// #region Repositories

/**
 * @param {Repository} repository
 * @param {string} modifier
 */
const generateRoleNameFromRepository = (repository, modifier) => `repository.${repository.pattern}.${repository.type}.${modifier}.${repository.id}`;

/**
 * @param { Repository } repository
 */
const onRepositoryUpsert = async (repository) => {
  const readOnlyRole = generateRoleNameFromRepository(repository, 'readonly');
  const allRole = generateRoleNameFromRepository(repository, 'all');
  try {
    await elasticRoles.upsertRole(readOnlyRole, [repository?.pattern], ['read']);
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

// #endregion Repositories

// #region Repositories-permissions

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

// #endregion Repositories-permissions

// #region Space

/**
 * @param {Space} space
 * @param {string} modifier
 */
const generateRoleNameFromSpace = (space, modifier) => `space.${space.id}.${space.type}.${modifier}`;

// space.${space.id}.${space.type}.readonly
/**
 * @param { Space } space
 */
const onSpaceCreate = async (space) => {
  try {
    await kibana.createSpace({
      id: space.id,
      name: space.name,
      initials: space.initials || undefined,
      color: space.color || undefined,
    });
    appLogger.verbose(`[kibana][hooks] Space [${space.id}] is created`);
  } catch (error) {
    appLogger.error(`[kibana][hooks] Space [${space.id}] cannot be created: ${error.message}`);
    return;
  }

  const readonlyRole = generateRoleNameFromSpace(space, 'readonly');
  try {
    await kibana.putRole({
      name: readonlyRole,
      kibana: [
        {
          spaces: [space.id],
          base: ['read'],
        },
      ],
    });
    appLogger.verbose(`[kibana][hooks] Role [${readonlyRole}] is created`);
  } catch (error) {
    appLogger.error(`[kibana][hooks] Role [${readonlyRole}] cannot be created: ${error.message}`);
  }

  const allRole = generateRoleNameFromSpace(space, 'all');
  try {
    await kibana.putRole({
      name: allRole,
      kibana: [
        {
          spaces: [space.id],
          base: ['all'],
        },
      ],
    });
    appLogger.verbose(`[kibana][hooks] Role [${allRole}] is created`);
  } catch (error) {
    appLogger.error(`[kibana][hooks] Role [${allRole}] cannot be created: ${error.message}`);
  }

  // TODO: create index pattern
};

/**
 * @param { Space } space
 */
const onSpaceUpdate = async (space) => {
  try {
    await kibana.updateSpace({
      id: space.id,
      name: space.name,
      initials: space.initials,
      color: space.color,
    });
    appLogger.verbose(`[kibana][hooks] Space [${space.id}] is updated`);
  } catch (error) {
    appLogger.error(`[kibana][hooks] Space [${space.id}] cannot be updated: ${error.message}`);
  }
};

/**
 * @param { Space } space
 */
const onSpaceUpsert = async (space) => {
  let spaceExist = false;
  try {
    spaceExist = !!(await kibana.getSpace(space.id));
  } catch (error) {
    appLogger.error(`[kibana][hooks] Space [${space.id}] cannot be getted: ${error.message}`);
    return;
  }

  if (spaceExist) {
    return onSpaceUpdate(space);
  }
  return onSpaceCreate(space);
};

/**
 * @param { Space } space
 */
const onSpaceDelete = async (space) => {
  try {
    await kibana.deleteSpace(space.id);
    appLogger.verbose(`[kibana][hooks] Space [${space.id}] is deleted`);
  } catch (error) {
    appLogger.error(`[kibana][hooks] Space [${space.id}] cannot be deleted: ${error.message}`);
    return;
  }

  const readonlyRole = generateRoleNameFromSpace(space, 'readonly');
  try {
    await kibana.deleteRole(readonlyRole);
    appLogger.verbose(`[kibana][hooks] Role [${readonlyRole}] is created`);
  } catch (error) {
    appLogger.error(`[kibana][hooks] Role [${readonlyRole}] cannot be created: ${error.message}`);
  }

  const allRole = generateRoleNameFromSpace(space, 'all');
  try {
    await kibana.deleteRole(allRole);
    appLogger.verbose(`[kibana][hooks] Role [${allRole}] is created`);
  } catch (error) {
    appLogger.error(`[kibana][hooks] Role [${allRole}] cannot be created: ${error.message}`);
  }

  // TODO: delete index pattern
};

hookEmitter.on('space:create', onSpaceCreate);
hookEmitter.on('space:update', onSpaceUpdate);
hookEmitter.on('space:upsert', onSpaceUpsert);
hookEmitter.on('space:delete', onSpaceDelete);

// #endregion Space

module.exports = hookEmitter;
