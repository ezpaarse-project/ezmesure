// @ts-check
const hookEmitter = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const kibana = require('../../services/kibana');

const { generateRoleNameFromSpace } = require('../utils');

/**
 * @typedef {import('@prisma/client').Space} Space
 */

/**
 * @param { Space } space
 */
const onSpaceCreate = async (space) => {
  try {
    await kibana.createSpace({
      id: space.id,
      name: space.name,
      description: space.description,
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
};

/**
 * @param { Space } space
 */
const onSpaceUpdate = async (space) => {
  try {
    await kibana.updateSpace({
      id: space.id,
      name: space.name,
      description: space.description,
      initials: space.initials || undefined,
      color: space.color || undefined,
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

module.exports = {
  onSpaceCreate,
  onSpaceUpdate,
  onSpaceUpsert,
  onSpaceDelete,
};
