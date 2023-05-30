// @ts-check
const hookEmitter = require('./_hookEmitter');

const { appLogger } = require('../services/logger');

const elasticUsers = require('../services/elastic/users');

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Membership} Membership
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
    appLogger.verbose(`[elastic][hooks] Admin user [${user.username}] cannot be created: ${error.message}`);
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
    });
    appLogger.verbose(`[elastic][hooks] User [${user.username}] is created`);
  } catch (error) {
    appLogger.verbose(`[elastic][hooks] User [${user.username}] cannot be created: ${error.message}`);
  }
};

/**
 * @param {User} user
 */
const onUserUpdate = async (user) => {
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
};

/**
 * @param {User} user
 */
const onUserDelete = async (user) => {
  try {
    await elasticUsers.deleteUser(user.username);
    appLogger.verbose(`[elastic][hooks] User [${user.username}] is deleted`);
  } catch (error) {
    appLogger.verbose(`[elastic][hooks] User [${user.username}] cannot be deleted: ${error.message}`);
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
    appLogger.verbose(`[elastic][hooks] User [${user.username}] cannot be upserted: ${error.message}`);
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

module.exports = hookEmitter;
