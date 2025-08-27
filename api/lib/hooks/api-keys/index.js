const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const { client: prisma } = require('../../services/prisma');

/**
 * @typedef {import('@prisma/client').ApiKey} ApiKey
 */

/**
 * @param { ApiKey } apiKey
 */
const onApiKeyAction = async (apiKey) => {
  // Update last activity of apiKey
  try {
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastActivity: new Date() },
    });
  } catch (err) {
    appLogger.warn(`Couldn't update last activity date: ${err.message || err}`);
  }
};

registerHook('api-key:action', onApiKeyAction, { uniqueResolver: (u) => u.username });
