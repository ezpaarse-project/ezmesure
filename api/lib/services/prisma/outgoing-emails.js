// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').Prisma.BatchPayload} BatchPayload
 * @typedef {import('../../.prisma/client.mjs').OutgoingEmail} OutgoingEmail
 * @typedef {import('../../.prisma/client.mjs').Prisma.OutgoingEmailUpdateArgs} OutgoingEmailUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.OutgoingEmailUpsertArgs} OutgoingEmailUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.OutgoingEmailFindUniqueArgs} OutgoingEmailFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.OutgoingEmailFindManyArgs} OutgoingEmailFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.OutgoingEmailCreateArgs} OutgoingEmailCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.OutgoingEmailCountArgs} OutgoingEmailCountArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.OutgoingEmailDeleteManyArgs} OutgoingEmailDeleteManyArgs
 */
/* eslint-enable max-len */

/**
 * @param {OutgoingEmailCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<OutgoingEmail>}
 */
function create(params, tx = prisma) {
  return tx.outgoingEmail.create(params);
}

/**
 * @param {OutgoingEmailFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<OutgoingEmail[]>}
 */
function findMany(params, tx = prisma) {
  return tx.outgoingEmail.findMany(params);
}

/**
 * @param {OutgoingEmailFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<OutgoingEmail | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.outgoingEmail.findUnique(params);
}

/**
 * @param {OutgoingEmailUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<OutgoingEmail>}
 */
function update(params, tx = prisma) {
  return tx.outgoingEmail.update(params);
}

/**
 * @param {OutgoingEmailUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<OutgoingEmail>}
 */
function upsert(params, tx = prisma) {
  return tx.outgoingEmail.upsert(params);
}

/**
 * @param {OutgoingEmailCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.outgoingEmail.count(params);
}

/**
 * @param {OutgoingEmailDeleteManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<BatchPayload>}
 */
function deleteMany(params, tx = prisma) {
  return tx.outgoingEmail.deleteMany(params);
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
  count,
  deleteMany,
};
