// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointUpdateArgs} SushiEndpointUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointUpsertArgs} SushiEndpointUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointFindUniqueArgs} SushiEndpointFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointFindManyArgs} SushiEndpointFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointCreateArgs} SushiEndpointCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointDeleteArgs} SushiEndpointDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {SushiEndpointCreateArgs} params
 * @returns {Promise<SushiEndpoint>}
 */
function create(params) {
  return prisma.sushiEndpoint.create(params);
}

/**
 * @param {SushiEndpointFindManyArgs} params
 * @returns {Promise<SushiEndpoint[]>}
 */
function findMany(params) {
  return prisma.sushiEndpoint.findMany(params);
}

/**
 * @param {SushiEndpointFindUniqueArgs} params
 * @returns {Promise<SushiEndpoint | null>}
 */
function findUnique(params) {
  return prisma.sushiEndpoint.findUnique(params);
}

/**
 * @param {string} id
 * @returns {Promise<SushiEndpoint | null>}
 */
function findByID(id) {
  return prisma.sushiEndpoint.findUnique({ where: { id } });
}

/**
 * @param {SushiEndpointUpdateArgs} params
 * @returns {Promise<SushiEndpoint>}
 */
function update(params) {
  return prisma.sushiEndpoint.update(params);
}

/**
 * @param {SushiEndpointUpsertArgs} params
 * @returns {Promise<SushiEndpoint>}
 */
function upsert(params) {
  return prisma.sushiEndpoint.upsert(params);
}

/**
 * @param {SushiEndpointDeleteArgs} params
 * @returns {Promise<SushiEndpoint | null>}
 */
async function remove(params) {
  const [deleteResult, deletedEndpoint] = await prisma.$transaction(async (tx) => {
    const endpoint = await tx.sushiEndpoint.findUnique({
      where: params.where,
      include: {
        credentials: true,
      },
    });

    if (!endpoint) {
      return [null, null];
    }

    await tx.sushiCredentials.deleteMany({
      where: { endpointId: endpoint.id },
    });

    return [
      await tx.sushiEndpoint.delete(params),
      endpoint,
    ];
  });

  if (!deletedEndpoint) {
    return null;
  }

  return { deleteResult, deletedEndpoint };
}

/**
 * @returns {Promise<Array<SushiEndpoint> | null>}
 */
async function deleteAll() {
  if (process.env.NODE_ENV === 'production') { return null; }

  const sushiEndpoints = await this.findMany({});

  await Promise.all(sushiEndpoints.map(async (sushiEndpoint) => {
    await remove({
      where: {
        id: sushiEndpoint.id,
      },
    });
  }));

  return sushiEndpoints;
}

module.exports = {
  create,
  findMany,
  findUnique,
  findByID,
  update,
  upsert,
  remove,
  deleteAll,
};
