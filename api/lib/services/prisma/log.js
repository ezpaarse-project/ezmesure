// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').Log} Log
 * @typedef {import('@prisma/client').Prisma.LogUpdateArgs} LogUpdateArgs
 * @typedef {import('@prisma/client').Prisma.LogUpsertArgs} LogUpsertArgs
 * @typedef {import('@prisma/client').Prisma.LogFindUniqueArgs} LogFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.LogFindManyArgs} LogFindManyArgs
 * @typedef {import('@prisma/client').Prisma.LogCreateArgs} LogCreateArgs
 * @typedef {import('@prisma/client').Prisma.LogCountArgs} LogCountArgs
 */
/* eslint-enable max-len */

/**
 * @param {LogCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Log>}
 */
function create(params, tx = prisma) {
  return tx.log.create(params);
}

/**
 * @param {LogFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Log[]>}
 */
function findMany(params, tx = prisma) {
  return tx.log.findMany(params);
}

/**
 * @param {LogFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Log | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.log.findUnique(params);
}

/**
 * @param {LogUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Log>}
 */
function update(params, tx = prisma) {
  return tx.log.update(params);
}

/**
 * @param {LogUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Log>}
 */
function upsert(params, tx = prisma) {
  return tx.log.upsert(params);
}

/**
 * @param {LogCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.log.count(params);
}

/**
 * @param {string} jobId - identifier of the associated harvest job
 * @param {string} level - log level
 * @param {string} message - log message
 * @param {TransactionClient} [tx]
 * @returns {Promise<Log>}
 */
function log(jobId, level, message, tx = prisma) {
  return tx.log.create({ data: { jobId, level, message } });
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
  count,
  log,
};
