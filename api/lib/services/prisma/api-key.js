// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('@prisma/client').ApiKey} ApiKey */
/** @typedef {import('@prisma/client').Prisma.ApiKeyUpdateArgs} ApiKeyUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyUpsertArgs} ApiKeyUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyCountArgs} ApiKeyCountArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyFindUniqueArgs} ApiKeyFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyFindManyArgs} ApiKeyFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyCreateArgs} ApiKeyCreateArgs */
/** @typedef {import('@prisma/client').Prisma.ApiKeyDeleteArgs} ApiKeyDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {ApiKeyCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKey>}
 */
function create(params, tx = prisma) {
  return tx.apiKey.create(params);
}

/**
 * @param {ApiKeyFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKey[]>}
 */
function findMany(params, tx = prisma) {
  return tx.apiKey.findMany(params);
}

/**
 * @param {ApiKeyFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKey | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.apiKey.findUnique(params);
}

/**
 * @param {string} id
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKey | null>}
 */
function findByID(id, tx = prisma) {
  return tx.apiKey.findUnique({ where: { id } });
}

/**
 * @param {ApiKeyUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKey>}
 */
function update(params, tx = prisma) {
  return tx.apiKey.update(params);
}

/**
 * @param {ApiKeyUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKey>}
 */
function upsert(params, tx = prisma) {
  return tx.apiKey.upsert(params);
}

/**
 * @param {ApiKeyCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.apiKey.count(params);
}

/**
 * @param {ApiKeyDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKey | null>}
 */
function remove(params, tx = prisma) {
  return tx.apiKey.delete(params).catch((e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return null;
    }
    throw e;
  });
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<ApiKey[] | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const apiKeys = await findMany({}, txx);

    if (apiKeys.length === 0) { return null; }

    await Promise.all(
      apiKeys.map((sushiCredential) => remove(
        { where: { id: sushiCredential.id } },
        txx,
      )),
    );

    return apiKeys;
  };

  if (tx) {
    return transaction(tx);
  }
  return prisma.$transaction(transaction);
}

module.exports = {
  create,
  findMany,
  findUnique,
  findByID,
  update,
  upsert,
  count,
  remove,
  removeAll,
};
