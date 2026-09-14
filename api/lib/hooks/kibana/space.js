// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const {
  syncDashboards,
  syncSpace,
  unmountSpace,
} = require('../../services/sync/kibana');

/* eslint-disable max-len */
/** @typedef {import('../../.prisma/client.mjs').Space} Space */
/** @typedef {import('../../entities/dashboard-collection.service').SpaceCollectionChangeHookPayload} SpaceCollectionChangeHookPayload */
/* eslint-enable max-len */

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

/**
 * @param {SpaceCollectionChangeHookPayload} payload
 */
const onCollectionChange = async ({ spaceId }) => {
  try {
    await syncDashboards(spaceId);
  } catch (error) {
    appLogger.error(
      `[kibana][hooks] Dashboards of space [${spaceId}] could not be synchronized:\n${error}`,
    );
  }
};

registerHook('space:create', onSpaceUpsert);
registerHook('space:update', onSpaceUpsert);
registerHook('space:upsert', onSpaceUpsert);
registerHook('space:delete', onSpaceDelete);
registerHook('dashboard_collection:added_to_space', onCollectionChange);
registerHook('dashboard_collection:removed_from_space', onCollectionChange);
