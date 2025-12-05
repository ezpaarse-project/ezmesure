// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').Step} Step
 * @typedef {import('../../.prisma/client.mjs').Prisma.StepUpdateArgs} StepUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.StepUpsertArgs} StepUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.StepFindUniqueArgs} StepFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.StepFindManyArgs} StepFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.StepCreateArgs} StepCreateArgs
 */
/* eslint-enable max-len */

/**
 * @param {StepCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Step>}
 */
function create(params, tx = prisma) {
  return tx.step.create(params);
}

/**
 * @param {StepFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Step[]>}
 */
function findMany(params, tx = prisma) {
  return tx.step.findMany(params);
}

/**
 * @param {StepFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Step | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.step.findUnique(params);
}

/**
 * @param {StepUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Step>}
 */
function update(params, tx = prisma) {
  return tx.step.update(params);
}

/**
 * @param {StepUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Step>}
 */
function upsert(params, tx = prisma) {
  return tx.step.upsert(params);
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
};
