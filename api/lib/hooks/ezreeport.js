// @ts-check
const EventEmitter = require('node:events');

const { appLogger } = require('../services/logger');

const { client: prisma } = require('../services/prisma.service');
const elasticUsers = require('../services/elastic/users');

const ezrUsers = require('../services/ezreeport/users');
const ezrNamespaces = require('../services/ezreeport/namespaces');
const ezrMemberships = require('../services/ezreeport/memberships');

const ezrEmitter = new EventEmitter();

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Membership} Membership
 */

/**
 * @param {Institution} institution
 */
const getReportingUserUsername = (institution) => `report.${institution.id}`;

// #region Users

// Using events of THIS event handler (not the whole bus)
ezrEmitter.on(
  'user:create-admin',
  /**
   * @param {User} user
   */
  (user) => ezrEmitter.emit('user:upsert', user),
);

ezrEmitter.on(
  'user:create',
  /**
   * @param {User} user
   */
  (user) => ezrEmitter.emit('user:upsert', user),
);

ezrEmitter.on(
  'user:update',
  /**
   * @param {User} user
   */
  (user) => ezrEmitter.emit('user:upsert', user),
);

ezrEmitter.on(
  'user:upsert',
  /**
   * @param {User} user
   */
  async (user) => {
    try {
      await ezrUsers.upsertFromUser(user);
      appLogger.verbose(`[ezreeport][hooks] User [${user.username}] is upserted`);
    } catch (error) {
      appLogger.verbose(`[ezreeport][hooks] User [${user.username}] cannot be upserted:\n${error}`);
    }
  },
);

ezrEmitter.on(
  'user:delete',
  /**
   * @param {User} user
   */
  async (user) => {
    try {
      await ezrUsers.deleteFromUser(user);
      appLogger.verbose(`[ezreeport][hooks] User [${user.username}] is deleted`);
    } catch (error) {
      appLogger.verbose(`[ezreeport][hooks] User [${user.username}] cannot be deleted:\n${error}`);
    }
  },
);

// #endregion Users

// #region Institutions

ezrEmitter.on(
  'institution:create',
  /**
   * @param {Institution} institution
   */
  (institution) => ezrEmitter.emit('institution:upsert', institution),
);

// Using events of THIS event handler (not the whole bus)
ezrEmitter.on(
  'institution:update',
  /**
   * @param {Institution} institution
   */
  (institution) => ezrEmitter.emit('institution:upsert', institution),
);

ezrEmitter.on(
  'institution:upsert',
  /**
   * @param {Institution} institution
   */
  async (institution) => {
    const username = getReportingUserUsername(institution);

    if (!institution.validated) {
      // Using event of THIS event handler (not the whole bus)
      ezrEmitter.emit('institution:delete', institution);
      return;
    }

    let created = false;
    try {
      await ezrNamespaces.upsertFromInstitution(institution);
      created = true;
      appLogger.verbose(`[ezreeport][hooks] Namespace [${institution.id}] is upserted`);
    } catch (error) {
      appLogger.verbose(`[ezreeport][hooks] Namespace [${institution.id}] cannot be upserted:\n${error}`);
    }

    if (!created) {
      return;
    }

    // Create reporting user
    try {
      if (!await elasticUsers.getUserByUsername(username)) {
        // TODO: Give rights to institution indexes
        await elasticUsers.createUser({
          username,
          email: 'noreply.report@ezmesure.couperin.org',
          fullName: `Reporting ${institution.acronym ?? institution.id}`,
        });
        appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is created in elastic`);
      }
    } catch (error) {
      appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] cannot be created in elastic:\n${error}`);
    }
  },
);

ezrEmitter.on(
  'institution:delete',
  /**
   * @param {Institution} institution
   */
  async (institution) => {
    const username = getReportingUserUsername(institution);

    let deleted = false;
    try {
      await ezrNamespaces.deleteFromInstitution(institution);
      deleted = true;
      appLogger.verbose(`[ezreeport][hooks] Namespace [${institution.id}] is deleted`);
    } catch (error) {
      appLogger.verbose(`[ezreeport][hooks] Namespace [${institution.id}] cannot be deleted:\n${error}`);
    }

    if (!deleted) {
      return;
    }

    // Delete reporting user
    try {
      await elasticUsers.deleteUser(username);
      appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is deleted in elastic`);
    } catch (error) {
      appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] cannot be deleted in elastic:\n${error}`);
    }
  },
);

// #endregion Institutions

module.exports = ezrEmitter;
