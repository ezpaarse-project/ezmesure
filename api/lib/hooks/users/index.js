const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const { client: prisma } = require('../../services/prisma');

/**
 * @typedef {import('@prisma/client').User} User
 */

/**
 * @param { User } user
 */
const onUserAction = async (user) => {
  // Update last activity of user
  try {
    await prisma.user.update({
      where: { username: user.username },
      data: { lastActivity: new Date() },
    });
  } catch (err) {
    appLogger.warn(`ouldn't update last activity date: ${err.message || err}`);
  }
};

registerHook('user:action', onUserAction, { uniqueResolver: (u) => u.username });
