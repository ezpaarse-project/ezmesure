// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Action} Action */
/** @typedef {import('@prisma/client').Prisma.ActionUpdateArgs} ActionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.ActionUpsertArgs} ActionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.ActionFindUniqueArgs} ActionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.ActionFindManyArgs} ActionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.ActionCreateArgs} ActionCreateArgs */
/* eslint-enable max-len */

/**
 * @param {ActionCreateArgs} params
 * @returns {Promise<Action>}
 */
function create(params) {
  return prisma.action.create(params);
}

/**
 * @param {ActionFindManyArgs} params
 * @returns {Promise<Action[]>}
 */
function findMany(params) {
  return prisma.action.findMany(params);
}

/**
 * @param {ActionFindUniqueArgs} params
 * @returns {Promise<Action | null>}
 */
function findUnique(params) {
  return prisma.action.findUnique(params);
}

/**
 * @param {ActionUpdateArgs} params
 * @returns {Promise<Action>}
 */
function update(params) {
  return prisma.action.update(params);
}

/**
 * @param {ActionUpsertArgs} params
 * @returns {Promise<Action>}
 */
function upsert(params) {
  return prisma.action.upsert(params);
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
};
