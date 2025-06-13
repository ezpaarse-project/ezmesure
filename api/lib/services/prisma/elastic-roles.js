// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('@prisma/client').ElasticRole} ElasticRole
 * @typedef {import('@prisma/client').Prisma.ElasticRoleUpdateArgs} ElasticRoleUpdateArgs
 * @typedef {import('@prisma/client').Prisma.ElasticRoleUpsertArgs} ElasticRoleUpsertArgs
 * @typedef {import('@prisma/client').Prisma.ElasticRoleCountArgs} ElasticRoleCountArgs
 * @typedef {import('@prisma/client').Prisma.ElasticRoleFindUniqueArgs} ElasticRoleFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.ElasticRoleFindFirstArgs} ElasticRoleFindFirstArgs
 * @typedef {import('@prisma/client').Prisma.ElasticRoleFindManyArgs} ElasticRoleFindManyArgs
 * @typedef {import('@prisma/client').Prisma.ElasticRoleCreateArgs} ElasticRoleCreateArgs
 * @typedef {import('@prisma/client').Prisma.ElasticRoleDeleteArgs} ElasticRoleDeleteArgs
 *
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Institution} institution
 *
 * @typedef {import('@prisma/client').Prisma.ElasticRoleGetPayload<{ include: { users: true, institutions: true } }>} OldElasticRole
 * @typedef {{deleteResult: ElasticRole, deletedElasticRole: OldElasticRole }} ElasticRoleRemoved
 * @typedef {{newElasticRole: ElasticRole, oldElasticRole: OldElasticRole }} ElasticRoleUpdated
 */
/* eslint-enable max-len */

/**
 * @param {ElasticRoleCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRole>}
 */
function create(params, tx = prisma) {
  return tx.elasticRole.create(params);
}

/**
 * @param {ElasticRoleFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRole[]>}
 */
function findMany(params, tx = prisma) {
  return tx.elasticRole.findMany(params);
}

/**
 * @param {ElasticRoleFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRole | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.elasticRole.findUnique(params);
}

/**
 * @param {ElasticRoleFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRole | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.elasticRole.findFirst(params);
}

/**
 * @param {ElasticRoleUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRole>}
 */
function update(params, tx = prisma) {
  return tx.elasticRole.update(params);
}

/**
 * @param {ElasticRoleUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRole>}
 */
function upsert(params, tx = prisma) {
  return tx.elasticRole.upsert(params);
}

/**
 * @param {ElasticRoleCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.elasticRole.count(params);
}

/**
 * @param {ElasticRoleDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<ElasticRoleRemoved | null>}
 */
async function remove(params, tx = prisma) {
  const elasticRole = await tx.elasticRole.findUnique({
    where: params.where,
    include: {
      users: true,
      institutions: true,
    },
  });

  if (!elasticRole) {
    return null;
  }

  return {
    deleteResult: await tx.elasticRole.delete(params),
    deletedElasticRole: elasticRole,
  };
}

module.exports = {
  create,
  findMany,
  findUnique,
  findFirst,
  update,
  upsert,
  count,
  remove,
};
