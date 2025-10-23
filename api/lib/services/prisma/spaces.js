// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client').Space} Space
 * @typedef {import('../../.prisma/client').Prisma.SpaceUpdateArgs} SpaceUpdateArgs
 * @typedef {import('../../.prisma/client').Prisma.SpaceUpsertArgs} SpaceUpsertArgs
 * @typedef {import('../../.prisma/client').Prisma.SpaceFindUniqueArgs} SpaceFindUniqueArgs
 * @typedef {import('../../.prisma/client').Prisma.SpaceFindManyArgs} SpaceFindManyArgs
 * @typedef {import('../../.prisma/client').Prisma.SpaceCreateArgs} SpaceCreateArgs
 * @typedef {import('../../.prisma/client').Prisma.SpaceDeleteArgs} SpaceDeleteArgs
 * @typedef {import('../../.prisma/client').Prisma.SpaceCountArgs} SpaceCountArgs
 * @typedef {import('../../.prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
 *
 * @typedef {import('../../.prisma/client').SpacePermission} SpacePermission
 * @typedef {import('../../.prisma/client').ElasticRoleSpacePermission} ElasticRoleSpacePermission
 *
 * @typedef {import('../../.prisma/client').Space & { permissions: SpacePermission[], elasticRolePermissions: ElasticRoleSpacePermission[] }} OldSpace
 * @typedef {{deleteResult: Space, deletedSpace: OldSpace }} SpaceRemoved
 */
/* eslint-enable max-len */

/**
 * @param {SpaceCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Space>}
 */
function create(params, tx = prisma) {
  return tx.space.create(params);
}

/**
 * @param {SpaceFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Space[]>}
 */
function findMany(params, tx = prisma) {
  return tx.space.findMany(params);
}

/**
 * @param {SpaceFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Space | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.space.findUnique(params);
}

/**
 * @param {string} id
 * @param {TransactionClient} [tx]
 * @returns {Promise<Space | null>}
 */
function findByID(id, tx = prisma) {
  return tx.space.findUnique({ where: { id } });
}

/**
 * @param {SpaceUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Space>}
 */
function update(params, tx = prisma) {
  return tx.space.update(params);
}

/**
 * @param {SpaceUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Space>}
 */
function upsert(params, tx = prisma) {
  return tx.space.upsert(params);
}

/**
 * @param {SpaceCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.space.count(params);
}

/**
 * @param {SpaceDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpaceRemoved | null>}
 */
async function remove(params, tx = prisma) {
  const space = await tx.space.findUnique({
    where: params.where,
    include: {
      permissions: true,
      elasticRolePermissions: true,
    },
  });

  if (!space) {
    return null;
  }

  return {
    deleteResult: await tx.space.delete(params),
    deletedSpace: space,
  };
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Array<Space> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const spaces = await findMany({}, txx);

    if (spaces.length === 0) { return null; }

    await Promise.all(
      spaces.map(
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

    return spaces;
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
  findByID,
  update,
  upsert,
  count,
  remove,
  removeAll,
};
