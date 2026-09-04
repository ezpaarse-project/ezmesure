// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').SpaceDashboardCollections} Dashboard
 * @typedef {import('../../.prisma/client.mjs').DashboardCollection} DashboardCollection
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardUpdateArgs} DashboardUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardUpsertArgs} DashboardUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCountArgs} DashboardCountArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardFindUniqueArgs} DashboardFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardFindFirstArgs} DashboardFindFirstArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardFindManyArgs} DashboardFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCreateArgs} DashboardCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardDeleteArgs} DashboardDeleteArgs
 *
 * @typedef {Dashboard & { collection: DashboardCollection | null }} OldDashboard
 * @typedef {{deleteResult: Dashboard, deletedDashboard: OldDashboard }} DashboardRemoved
 * @typedef {{newDashboard: Dashboard, oldDashboard: OldDashboard }} DashboardUpdated
 */
/* eslint-enable max-len */

/**
 * @param {DashboardCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Dashboard>}
 */
function create(params, tx = prisma) {
  return tx.dashboard.create(params);
}

/**
 * @param {DashboardFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Dashboard[]>}
 */
function findMany(params, tx = prisma) {
  return tx.dashboard.findMany(params);
}

/**
 * @param {DashboardFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Dashboard | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.dashboard.findUnique(params);
}

/**
 * @param {DashboardFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Dashboard | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.dashboard.findFirst(params);
}

/**
 * @param {string} id
 * @param {TransactionClient} [tx]
 * @returns {Promise<Dashboard | null>}
 */
function findById(id, tx = prisma) {
  return tx.dashboard.findUnique({ where: { id } });
}

/**
 * @param {DashboardUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Dashboard>}
 */
function update(params, tx = prisma) {
  return tx.dashboard.update(params);
}

/**
 * @param {DashboardUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Dashboard>}
 */
function upsert(params, tx = prisma) {
  return tx.dashboard.upsert(params);
}

/**
 * @param {DashboardCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.dashboard.count(params);
}

/**
 * @param {DashboardDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardRemoved | null>}
 */
async function remove(params, tx = prisma) {
  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const dashboard = await txx.dashboard.findUnique({
      where: params.where,
      include: {
        collection: true,
      },
    });

    if (!dashboard) {
      return null;
    }

    return {
      deleteResult: await txx.dashboard.delete(params),
      deletedDashboard: dashboard,
    };
  };

  let transactionResult;
  if (tx) {
    transactionResult = await transaction(tx);
  } else {
    transactionResult = await prisma.$transaction(transaction);
  }

  return transactionResult;
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Array<Dashboard> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const dashboards = await findMany({}, txx);

    if (dashboards.length === 0) { return null; }

    await Promise.all(
      dashboards.map((dashboard) => remove({ where: { id: dashboard.id } }, txx)),
    );

    return dashboards;
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
  findFirst,
  findById,
  update,
  upsert,
  count,
  remove,
  removeAll,
};
