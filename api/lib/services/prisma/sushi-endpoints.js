// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint
 * @typedef {import('@prisma/client').SushiCredentials} SushiCredentials
 * @typedef {import('@prisma/client').Prisma.SushiEndpointUpdateArgs} SushiEndpointUpdateArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointUpsertArgs} SushiEndpointUpsertArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointFindUniqueArgs} SushiEndpointFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointFindManyArgs} SushiEndpointFindManyArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointCreateArgs} SushiEndpointCreateArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointDeleteArgs} SushiEndpointDeleteArgs
 * @typedef {{deleteResult: SushiEndpoint, deletedEndpoint: (SushiEndpoint & { credentials: SushiCredentials[] }) }} SushiEndpointRemoved
 */

/* eslint-enable max-len */

/**
 * @param {SushiEndpointCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiEndpoint>}
 */
function create(params, tx = prisma) {
  return tx.sushiEndpoint.create(params);
}

/**
 * @param {SushiEndpointFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiEndpoint[]>}
 */
function findMany(params, tx = prisma) {
  return tx.sushiEndpoint.findMany(params);
}

/**
 * @param {SushiEndpointFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiEndpoint | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.sushiEndpoint.findUnique(params);
}

/**
 * @param {string} id
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiEndpoint | null>}
 */
function findByID(id, tx = prisma) {
  return tx.sushiEndpoint.findUnique({ where: { id } });
}

/**
 * @param {SushiEndpointUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiEndpoint>}
 */
function update(params, tx = prisma) {
  return tx.sushiEndpoint.update(params);
}

/**
 * @param {SushiEndpointUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiEndpoint>}
 */
function upsert(params, tx = prisma) {
  return tx.sushiEndpoint.upsert(params);
}

/**
 * @param {SushiEndpointDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiEndpointRemoved | null>}
 */
async function remove(params, tx = prisma) {
  const endpoint = await tx.sushiEndpoint.findUnique({
    where: params.where,
    include: {
      credentials: true,
    },
  });

  if (!endpoint) {
    return null;
  }

  return {
    deleteResult: await tx.sushiEndpoint.delete(params),
    deletedEndpoint: endpoint,
  };
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<SushiEndpoint[] | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const processor = async (txx) => {
    const sushiEndpoints = await findMany({}, txx);

    if (sushiEndpoints.length === 0) { return null; }

    await Promise.all(
      sushiEndpoints.map((sushiEndpoint) => remove(
        { where: { id: sushiEndpoint.id } },
        txx,
      )),
    );

    return sushiEndpoints;
  };

  if (tx) {
    return processor(tx);
  }
  return prisma.$transaction(processor);
}

module.exports = {
  create,
  findMany,
  findUnique,
  findByID,
  update,
  upsert,
  remove,
  removeAll,
};
