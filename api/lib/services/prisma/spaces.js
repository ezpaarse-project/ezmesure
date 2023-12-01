// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Space} Space
 * @typedef {import('@prisma/client').Prisma.SpaceUpdateArgs} SpaceUpdateArgs
 * @typedef {import('@prisma/client').Prisma.SpaceUpsertArgs} SpaceUpsertArgs
 * @typedef {import('@prisma/client').Prisma.SpaceFindUniqueArgs} SpaceFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.SpaceFindManyArgs} SpaceFindManyArgs
 * @typedef {import('@prisma/client').Prisma.SpaceCreateArgs} SpaceCreateArgs
 * @typedef {import('@prisma/client').Prisma.SpaceDeleteArgs} SpaceDeleteArgs
 * @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
 * @typedef {{deleteResult: Space, deletedSpace: Space }} SpaceRemoved
 */
/* eslint-enable max-len */

/**
   * @param {SpaceCreateArgs} params
   * @returns {Promise<Space>}
   */
function create(params) {
  return prisma.space.create(params);
}

/**
   * @param {SpaceFindManyArgs} params
   * @returns {Promise<Space[]>}
   */
function findMany(params) {
  return prisma.space.findMany(params);
}

/**
   * @param {SpaceFindUniqueArgs} params
   * @returns {Promise<Space | null>}
   */
function findUnique(params) {
  return prisma.space.findUnique(params);
}

/**
   * @param {string} id
   * @returns {Promise<Space | null>}
   */
function findByID(id) {
  return prisma.space.findUnique({ where: { id } });
}

/**
   * @param {SpaceUpdateArgs} params
   * @returns {Promise<Space>}
   */
function update(params) {
  return prisma.space.update(params);
}

/**
   * @param {SpaceUpsertArgs} params
   * @returns {Promise<Space>}
   */
function upsert(params) {
  return prisma.space.upsert(params);
}

/**
   * @param {SpaceDeleteArgs} params
   * @returns {Promise<SpaceRemoved | null>}
   */
async function remove(params) {
  const { deleteResult, deletedSpace } = await prisma.$transaction(async (tx) => {
    const space = await tx.space.findUnique({
      where: params.where,
      include: {
        permissions: true,
      },
    });

    if (!space) {
      return [null, null];
    }

    await tx.spacePermission.deleteMany({
      where: { spaceId: space.id },
    });

    return {
      deleteResult: await tx.space.delete(params),
      deletedSpace: space,
    };
  });

  if (!deletedSpace) {
    return null;
  }

  return { deleteResult, deletedSpace };
}

/**
   * @returns {Promise<Array<Space> | null>}
   */
async function removeAll() {
  if (process.env.NODE_ENV === 'production') { return null; }

  const spaces = await this.findMany({});

  await Promise.all(spaces.map(async (space) => {
    await this.delete({
      where: {
        id: space.id,
      },
    });
  }));

  return spaces;
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
