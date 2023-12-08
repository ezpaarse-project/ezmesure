// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SushiCredentials} SushiCredentials */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpdateArgs} SushiCredentialsUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsUpsertArgs} SushiCredentialsUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsFindUniqueArgs} SushiCredentialsFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsFindManyArgs} SushiCredentialsFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsCreateArgs} SushiCredentialsCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsDeleteArgs} SushiCredentialsDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {SushiCredentialsCreateArgs} params
 * @returns {Promise<SushiCredentials>}
 */
function create(params) {
  return prisma.sushiCredentials.create(params);
}

/**
 * @param {SushiCredentialsFindManyArgs} params
 * @returns {Promise<SushiCredentials[]>}
 */
function findMany(params) {
  return prisma.sushiCredentials.findMany(params);
}

/**
 * @param {SushiCredentialsFindUniqueArgs} params
 * @returns {Promise<SushiCredentials | null>}
 */
function findUnique(params) {
  return prisma.sushiCredentials.findUnique(params);
}

/**
 * @param {string} id
 * @returns {Promise<SushiCredentials | null>}
 */
function findByID(id) {
  return prisma.sushiCredentials.findUnique({ where: { id } });
}

/**
 * @param {SushiCredentialsUpdateArgs} params
 * @returns {Promise<SushiCredentials>}
 */
function update(params) {
  return prisma.sushiCredentials.update(params);
}

/**
 * @param {SushiCredentialsUpsertArgs} params
 * @returns {Promise<SushiCredentials>}
 */
function upsert(params) {
  return prisma.sushiCredentials.upsert(params);
}

/**
 * @param {SushiCredentialsDeleteArgs} params
 * @returns {Promise<SushiCredentials | null>}
 */
function remove(params) {
  return prisma.sushiCredentials.delete(params).catch((e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return null;
    }
    throw e;
  });
}

/**
 * @returns {Promise<Array<SushiCredentials> | null>}
 */
async function removeAll() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  const sushiCredentials = await findMany({});

  if (sushiCredentials.length === 0) { return null; }

  await Promise.all(sushiCredentials.map(async (sushiCredential) => {
    await remove({
      where: {
        id: sushiCredential.id,
      },
    });
  }));

  return sushiCredentials;
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
