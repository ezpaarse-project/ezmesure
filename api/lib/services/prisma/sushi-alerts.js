// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client').SushiAlert} SushiAlert
 * @typedef {import('../../.prisma/client').Prisma.SushiAlertUpdateArgs} SushiAlertUpdateArgs
 * @typedef {import('../../.prisma/client').Prisma.SushiAlertUpsertArgs} SushiAlertUpsertArgs
 * @typedef {import('../../.prisma/client').Prisma.SushiAlertFindUniqueArgs} SushiAlertFindUniqueArgs
 * @typedef {import('../../.prisma/client').Prisma.SushiAlertFindManyArgs} SushiAlertFindManyArgs
 * @typedef {import('../../.prisma/client').Prisma.SushiAlertCreateArgs} SushiAlertCreateArgs
 * @typedef {import('../../.prisma/client').Prisma.SushiAlertDeleteArgs} SushiAlertDeleteArgs
 * @typedef {import('../../.prisma/client').Prisma.SushiAlertDeleteManyArgs} SushiAlertDeleteManyArgs
 * @typedef {import('../../.prisma/client').Prisma.SushiAlertCountArgs} SushiAlertCountArgs
 *
 * @typedef {{deleteResult: SushiAlert, deletedAlert: SushiAlert }} AlertRemoved
 */
/* eslint-enable max-len */

/**
 * @param {SushiAlertCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiAlert>}
 */
function create(params, tx = prisma) {
  return tx.sushiAlert.create(params);
}

/**
 * @param {SushiAlertFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiAlert[]>}
 */
function findMany(params, tx = prisma) {
  return tx.sushiAlert.findMany(params);
}

/**
 * @param {SushiAlertFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiAlert | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.sushiAlert.findUnique(params);
}

/**
 * @param {SushiAlertUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiAlert>}
 */
function update(params, tx = prisma) {
  return tx.sushiAlert.update(params);
}

/**
 * @param {SushiAlertUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiAlert>}
 */
function upsert(params, tx = prisma) {
  return tx.sushiAlert.upsert(params);
}

/**
 * @param {SushiAlertCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.sushiAlert.count(params);
}

/**
 * @param {SushiAlertDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<AlertRemoved | null>}
 */
async function remove(params, tx = prisma) {
  const alert = await tx.sushiAlert.findUnique({
    where: params.where,
  });

  if (!alert) {
    return null;
  }

  return {
    deleteResult: await tx.sushiAlert.delete(params),
    deletedAlert: alert,
  };
}

/**
 * @param {SushiAlertDeleteManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiAlert[]>}
 */
async function removeMany(params, tx = prisma) {
  const alerts = await tx.sushiAlert.findMany({
    where: params.where,
  });

  await tx.sushiAlert.deleteMany(params);

  return alerts;
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Array<SushiAlert> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const alerts = await findMany({}, txx);

    if (alerts.length === 0) { return null; }

    await Promise.all(
      alerts.map(
        (space) => remove(
          {
            where: {
              id: space.id,
            },
          },
          txx,
        ),
      ),
    );

    return alerts;
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
  update,
  upsert,
  count,
  remove,
  removeMany,
  removeAll,
};
