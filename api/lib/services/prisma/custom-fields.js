// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('../../.prisma/client').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('../../.prisma/client').CustomField} CustomField */
/** @typedef {import('../../.prisma/client').Prisma.CustomFieldUpdateArgs} CustomFieldUpdateArgs */
/** @typedef {import('../../.prisma/client').Prisma.CustomFieldUpsertArgs} CustomFieldUpsertArgs */
/** @typedef {import('../../.prisma/client').Prisma.CustomFieldFindUniqueArgs} CustomFieldFindUniqueArgs */
/** @typedef {import('../../.prisma/client').Prisma.CustomFieldFindManyArgs} CustomFieldFindManyArgs */
/** @typedef {import('../../.prisma/client').Prisma.CustomFieldCountArgs} CustomFieldCountArgs */
/** @typedef {import('../../.prisma/client').Prisma.CustomFieldCreateArgs} CustomFieldCreateArgs */
/** @typedef {import('../../.prisma/client').Prisma.CustomFieldDeleteArgs} CustomFieldDeleteArgs */
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
 * @param {string} id
 * @param {Object | null} [includes]
 * @param {TransactionClient} [tx]
 * @returns {Promise<CustomField | null>}
 */
function findById(id, includes, tx = prisma) {
  return tx.customField.findUnique({
    where: { id },
    include: includes ? { ...includes } : undefined,
  });
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

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<CustomField[] | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const customFields = await findMany({}, txx);

    if (customFields.length === 0) { return null; }

    await Promise.all(
      customFields.map((sushiEndpoint) => remove(
        { where: { id: sushiEndpoint.id } },
        txx,
      )),
    );

    return customFields;
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
  findById,
  count,
  update,
  upsert,
  remove,
  removeAll,
};
