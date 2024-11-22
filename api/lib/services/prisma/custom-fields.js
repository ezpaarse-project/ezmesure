// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('@prisma/client').CustomField} CustomField */
/** @typedef {import('@prisma/client').Prisma.CustomFieldUpdateArgs} CustomFieldUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.CustomFieldUpsertArgs} CustomFieldUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.CustomFieldFindUniqueArgs} CustomFieldFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.CustomFieldFindManyArgs} CustomFieldFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.CustomFieldCountArgs} CustomFieldCountArgs */
/** @typedef {import('@prisma/client').Prisma.CustomFieldCreateArgs} CustomFieldCreateArgs */
/** @typedef {import('@prisma/client').Prisma.CustomFieldDeleteArgs} CustomFieldDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {CustomFieldCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<CustomField>}
 */
function create(params, tx = prisma) {
  return tx.customField.create(params);
}

/**
 * @param {CustomFieldFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<CustomField[]>}
 */
function findMany(params, tx = prisma) {
  return tx.customField.findMany(params);
}

/**
 * @param {CustomFieldFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<CustomField | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.customField.findUnique(params);
}

/**
 * @param {CustomFieldCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.customField.count(params);
}

/**
 * @param {CustomFieldUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<CustomField>}
 */
function update(params, tx = prisma) {
  return tx.customField.update(params);
}

/**
 * @param {CustomFieldUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<CustomField>}
 */
function upsert(params, tx = prisma) {
  return tx.customField.upsert(params);
}

/**
 * @param {CustomFieldDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<CustomField | null>}
 */
function remove(params, tx = prisma) {
  return tx.customField.delete(params).catch((e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return null;
    }
    throw e;
  });
}

module.exports = {
  create,
  findMany,
  findUnique,
  count,
  update,
  upsert,
  remove,
};
