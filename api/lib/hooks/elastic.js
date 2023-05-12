// @ts-check
const EventEmitter = require('node:events');

const { appLogger } = require('../services/logger');

const elasticUsers = require('../services/elastic/users');

const elasticEmitter = new EventEmitter();

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Membership} Membership
 */

// #region Users
elasticEmitter.on(
  'user:create-admin',
  /**
   * @param {User} user
   */
  async (user) => {
    try {
      await elasticUsers.createAdmin();
      appLogger.verbose(`[elastic][hooks] Admin user [${user.username}] is created`);
    } catch (error) {
      appLogger.verbose(`[elastic][hooks] Admin user [${user.username}] cannot be created: ${error.message}`);
    }
  },
);

elasticEmitter.on(
  'user:create',
  /**
   * @param {User} user
   */
  async (user) => {
    try {
      await elasticUsers.createUser({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      });
      appLogger.verbose(`[elastic][hooks] User [${user.username}] is created`);
    } catch (error) {
      appLogger.verbose(`[elastic][hooks] User [${user.username}] cannot be created: ${error.message}`);
    }
  },
);

elasticEmitter.on(
  'user:update',
  /**
   * @param {User} user
   */
  async (user) => {
    try {
      await elasticUsers.updateUser({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      });
      appLogger.verbose(`[elastic][hooks] User [${user.username}] is updated`);
    } catch (error) {
      appLogger.verbose(`[elastic][hooks] User [${user.username}] cannot be updated: ${error.message}`);
    }
  },
);

elasticEmitter.on(
  'user:upsert',
  /**
   * @param {User} user
   */
  async (user) => {
    try {
    // Using events of THIS event handler (not the whole bus)
      if (await elasticUsers.getUserByUsername(user.username)) {
        elasticEmitter.emit('user:update', user);
      } else {
        elasticEmitter.emit('user:create', user);
      }
    } catch (error) {
      appLogger.verbose(`[elastic][hooks] User [${user.username}] cannot be upserted: ${error.message}`);
    }
  },
);

elasticEmitter.on(
  'user:delete',
  /**
   * @param {User} user
   */
  async (user) => {
    try {
      await elasticUsers.deleteUser(user.username);
      appLogger.verbose(`[elastic][hooks] User [${user.username}] is deleted`);
    } catch (error) {
      appLogger.verbose(`[elastic][hooks] User [${user.username}] cannot be deleted: ${error.message}`);
    }
  },
);
// #endregion Users

// // #region Institutions
// elasticEmitter.on(
//   'institution:create',
//   /**
//    * @param {Institution} institution
//    */
//   async (institution) => {},
// );

// elasticEmitter.on(
//   'institution:update',
//   /**
//    * @param {Institution} institution
//    */
//   async (institution) => {},
// );

// elasticEmitter.on(
//   'institution:upsert',
//   /**
//    * @param {Institution} institution
//    */
//   async (institution) => {},
// );

// elasticEmitter.on(
//   'institution:delete',
//   /**
//    * @param {Institution} institution
//    */
//   async (institution) => {},
// );
// // #endregion Institutions

module.exports = elasticEmitter;
