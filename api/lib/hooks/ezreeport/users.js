// @ts-check
const hookEmitter = require('../_hookEmitter');

const { appLogger } = require('../../services/logger');

const ezrUsers = require('../../services/ezreeport/users');

/**
 * @typedef {import('@prisma/client').User} User
 */

/**
 * @param {User} user
 */
const onUserDelete = async (user) => {
  try {
    await ezrUsers.deleteFromUser(user);
    appLogger.verbose(`[ezreeport][hooks] User [${user.username}] is deleted`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] User [${user.username}] cannot be deleted:\n${error}`);
  }
};

/**
 * @param {User} user
 */
const onUserUpsert = async (user) => {
  try {
    await ezrUsers.upsertFromUser(user);
    appLogger.verbose(`[ezreeport][hooks] User [${user.username}] is upserted`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] User [${user.username}] cannot be upserted:\n${error}`);
  }
};

hookEmitter.on('user:create-admin', onUserUpsert);
hookEmitter.on('user:create', onUserUpsert);
hookEmitter.on('user:update', onUserUpsert);
hookEmitter.on('user:upsert', onUserUpsert);
hookEmitter.on('user:delete', onUserDelete);

module.exports = {
  onUserUpsert,
  onUserDelete,
};
