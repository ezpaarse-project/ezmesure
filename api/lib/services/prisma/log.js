// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Log} Log */
/** @typedef {import('@prisma/client').Prisma.LogUpdateArgs} LogUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.LogUpsertArgs} LogUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.LogFindUniqueArgs} LogFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.LogFindManyArgs} LogFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.LogCreateArgs} LogCreateArgs */
/* eslint-enable max-len */

/**
 * @param {LogCreateArgs} params
 * @returns {Promise<Log>}
 */
function create(params) {
  return prisma.log.create(params);
}

/**
 * @param {LogFindManyArgs} params
 * @returns {Promise<Log[]>}
 */
function findMany(params) {
  return prisma.log.findMany(params);
}

/**
 * @param {LogFindUniqueArgs} params
 * @returns {Promise<Log | null>}
 */
function findUnique(params) {
  return prisma.log.findUnique(params);
}

/**
 * @param {LogUpdateArgs} params
 * @returns {Promise<Log>}
 */
function update(params) {
  return prisma.log.update(params);
}

/**
 * @param {LogUpsertArgs} params
 * @returns {Promise<Log>}
 */
function upsert(params) {
  return prisma.log.upsert(params);
}

/**
 * @param {string} jobId - identifier of the associated harvest job
 * @param {string} level - log level
 * @param {string} message - log message
 * @returns {Promise<Log>}
 */
function log(jobId, level, message) {
  return prisma.log.create({ data: { jobId, level, message } });
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
  log,
};
