// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('@prisma/client').SushiCredentials} SushiCredentials */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpdateArgs} SushiCredentialsUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpsertArgs} SushiCredentialsUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsCountArgs} SushiCredentialsCountArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsFindUniqueArgs} SushiCredentialsFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsFindManyArgs} SushiCredentialsFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsCreateArgs} SushiCredentialsCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsDeleteArgs} SushiCredentialsDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {SushiCredentialsCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiCredentials>}
 */
function create(params, tx = prisma) {
  return tx.sushiCredentials.create(params);
}

/**
 * @param {SushiCredentialsFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiCredentials[]>}
 */
function findMany(params, tx = prisma) {
  return tx.sushiCredentials.findMany(params);
}

/**
 * @param {SushiCredentialsFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiCredentials | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.sushiCredentials.findUnique(params);
}

/**
 * @param {string} id
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiCredentials | null>}
 */
function findByID(id, tx = prisma) {
  return tx.sushiCredentials.findUnique({ where: { id } });
}

/**
 * @param {SushiCredentialsUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiCredentials>}
 */
function update(params, tx = prisma) {
  return tx.sushiCredentials.update(params);
}

/**
 * @param {SushiCredentialsUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiCredentials>}
 */
function upsert(params, tx = prisma) {
  return tx.sushiCredentials.upsert(params);
}

/**
 * @param {SushiCredentialsCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.sushiCredentials.count(params);
}

/**
 * @param {SushiCredentialsDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiCredentials | null>}
 */
function remove(params, tx = prisma) {
  return tx.sushiCredentials.delete(params).catch((e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return null;
    }
    throw e;
  });
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiCredentials[] | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const sushiCredentials = await findMany({}, txx);

    if (sushiCredentials.length === 0) { return null; }

    await Promise.all(
      sushiCredentials.map((sushiCredential) => remove(
        { where: { id: sushiCredential.id } },
        txx,
      )),
    );

    return sushiCredentials;
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
