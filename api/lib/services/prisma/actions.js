// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').Action} Action
 * @typedef {import('@prisma/client').Prisma.ActionUpdateArgs} ActionUpdateArgs
 * @typedef {import('@prisma/client').Prisma.ActionUpsertArgs} ActionUpsertArgs
 * @typedef {import('@prisma/client').Prisma.ActionFindUniqueArgs} ActionFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.ActionFindManyArgs} ActionFindManyArgs
 * @typedef {import('@prisma/client').Prisma.ActionCreateArgs} ActionCreateArgs
 */
/* eslint-enable max-len */

/**
 * @param {ActionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Action>}
 */
function create(params, tx = prisma) {
  return tx.action.create(params);
}

/**
 * @param {ActionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Action[]>}
 */
function findMany(params, tx = prisma) {
  return tx.action.findMany(params);
}

/**
 * @param {ActionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Action | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.action.findUnique(params);
}

/**
 * @param {ActionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Action>}
 */
function update(params, tx = prisma) {
  return tx.action.update(params);
}

/**
 * @param {ActionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Action>}
 */
function upsert(params, tx = prisma) {
  return tx.action.upsert(params);
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
};
