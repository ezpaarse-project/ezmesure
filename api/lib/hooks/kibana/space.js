// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const {
  syncSpace,
  unmountSpace,
} = require('../../services/sync/kibana');

/**
 * @typedef {import('@prisma/client').Space} Space
 */

/**
 * @param { Space } space
 */
const onSpaceUpsert = async (space) => {
  try {
    await syncSpace(space);
  } catch (error) {
    appLogger.error(
      `[spaces][hooks] Space [${space?.id}] could not be synchronized:\n${error}`,
    );
  }
};

/**
 * @param { Space } space
 */
const onSpaceDelete = async (space) => {
  try {
    await unmountSpace(space);
  } catch (error) {
    appLogger.error(
      `[kibana][hooks] Space [${space?.id}] could not be unmounted:\n${error}`,
    );
  }
};

registerHook('space:create', onSpaceUpsert);
registerHook('space:update', onSpaceUpsert);
registerHook('space:upsert', onSpaceUpsert);
registerHook('space:delete', onSpaceDelete);
