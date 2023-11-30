// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SpacePermission} SpacePermission */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionUpdateArgs} SpacePermissionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionUpsertArgs} SpacePermissionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionFindUniqueArgs} SpacePermissionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionFindManyArgs} SpacePermissionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionCreateArgs} SpacePermissionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteArgs} SpacePermissionDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {SpacePermissionCreateArgs} params
 * @returns {Promise<SpacePermission>}
 */
function create(params) {
  return prisma.spacePermission.create(params);
}

/**
 * @param {SpacePermissionFindManyArgs} params
 * @returns {Promise<SpacePermission[]>}
 */
function findMany(params) {
  return prisma.spacePermission.findMany(params);
}

/**
 * @param {SpacePermissionFindUniqueArgs} params
 * @returns {Promise<SpacePermission | null>}
 */
function findUnique(params) {
  return prisma.spacePermission.findUnique(params);
}

/**
 * @param {SpacePermissionUpdateArgs} params
 * @returns {Promise<SpacePermission>}
 */
function update(params) {
  return prisma.spacePermission.update(params);
}

/**
 * @param {SpacePermissionUpsertArgs} params
 * @returns {Promise<SpacePermission>}
 */
function upsert(params) {
  return prisma.spacePermission.upsert(params);
}

/**
 * @param {SpacePermissionDeleteArgs} params
 * @returns {Promise<SpacePermission | null>}
 */
async function remove(params) {
  let spacePermission;

  try {
    spacePermission = await prisma.spacePermission.delete(params);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }

  return spacePermission;
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
  remove,
};
