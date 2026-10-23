// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').SpaceDashboardCollections} Dashboard
 * @typedef {import('../../.prisma/client.mjs').DashboardCollection} DashboardCollection
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCollectionUpdateArgs} DashboardCollectionUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCollectionUpsertArgs} DashboardCollectionUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCollectionCountArgs} DashboardCollectionCountArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCollectionFindUniqueArgs} DashboardCollectionFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCollectionFindFirstArgs} DashboardCollectionFindFirstArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCollectionFindManyArgs} DashboardCollectionFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCollectionCreateArgs} DashboardCollectionCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.DashboardCollectionDeleteArgs} DashboardCollectionDeleteArgs
 *
 * @typedef {DashboardCollection & { dashboards: Dashboard[] }} OldDashboardCollection
 * @typedef {{deleteResult: DashboardCollection, deletedDashboardCollection: OldDashboardCollection }} DashboardCollectionRemoved
 * @typedef {{newDashboardCollection: DashboardCollection, oldDashboardCollection: OldDashboardCollection }} DashboardCollectionUpdated
 */
/* eslint-enable max-len */

/**
 * @param {DashboardCollectionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardCollection>}
 */
function create(params, tx = prisma) {
  return tx.dashboardCollection.create(params);
}

/**
 * @param {DashboardCollectionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardCollection[]>}
 */
function findMany(params, tx = prisma) {
  return tx.dashboardCollection.findMany(params);
}

/**
 * @param {DashboardCollectionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardCollection | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.dashboardCollection.findUnique(params);
}

/**
 * @param {DashboardCollectionFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardCollection | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.dashboardCollection.findFirst(params);
}

/**
 * @param {string} id
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardCollection | null>}
 */
function findById(id, tx = prisma) {
  return tx.dashboardCollection.findUnique({ where: { id } });
}

/**
 * @param {DashboardCollectionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardCollection>}
 */
function update(params, tx = prisma) {
  return tx.dashboardCollection.update(params);
}

/**
 * @param {DashboardCollectionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardCollection>}
 */
function upsert(params, tx = prisma) {
  return tx.dashboardCollection.upsert(params);
}

/**
 * @param {DashboardCollectionCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.dashboardCollection.count(params);
}

/**
 * Add a dashboard to a collection
 * @param {string} collectionId
 * @param {string} spaceId
 * @param {string} repositoryPattern
 * @param {TransactionClient} [tx]
 */
function addToSpace(collectionId, spaceId, repositoryPattern, tx = prisma) {
  return tx.dashboardCollection.update({
    where: { id: collectionId },
    data: {
      spaces: {
        connectOrCreate: {
          where: {
            collectionId_spaceId_repositoryPattern: {
              collectionId,
              spaceId,
              repositoryPattern,
            },
          },
          create: {
            spaceId,
            repositoryPattern,
          },
        },
      },
    },
  });
}

/**
 * Remove a dashboard from a collection
 * @param {string} collectionId
 * @param {string} spaceId
 * @param {string} repositoryPattern
 * @param {TransactionClient} [tx]
 */
async function removeFromSpace(collectionId, spaceId, repositoryPattern, tx = prisma) {
  return tx.dashboardCollection.update({
    where: { id: collectionId },
    data: {
      spaces: {
        delete: {
          collectionId_spaceId_repositoryPattern: {
            collectionId,
            spaceId,
            repositoryPattern,
          },
        },
      },
    },
  });
}

/**
 * @param {DashboardCollectionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<DashboardCollectionRemoved | null>}
 */
async function remove(params, tx = prisma) {
  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const collection = await txx.dashboardCollection.findUnique({
      where: params.where,
      include: {
        dashboards: true,
        spaces: true,
      },
    });

    if (!collection) {
      return null;
    }

    return {
      deleteResult: await txx.dashboardCollection.delete(params),
      deletedDashboardCollection: collection,
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
 * @returns {Promise<Array<DashboardCollection> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const collections = await findMany({}, txx);

    if (collections.length === 0) { return null; }

    await Promise.all(
      collections.map((dashboard) => remove({ where: { id: dashboard.id } }, txx)),
    );

    return collections;
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
  addToSpace,
  removeFromSpace,
  remove,
  removeAll,
};
