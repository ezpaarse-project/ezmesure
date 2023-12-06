// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionUpdateArgs} RepositoryPermissionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionUpsertArgs} RepositoryPermissionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionFindUniqueArgs} RepositoryPermissionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionFindManyArgs} RepositoryPermissionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionCreateArgs} RepositoryPermissionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionDeleteArgs} RepositoryPermissionDeleteArgs */
/* eslint-enable max-len */

/**
 * @param {RepositoryPermissionCreateArgs} params
 * @returns {Promise<RepositoryPermission>}
 */
function create(params) {
  return prisma.repositoryPermission.create(params);
}

/**
 * @param {RepositoryPermissionFindManyArgs} params
 * @returns {Promise<RepositoryPermission[]>}
 */
function findMany(params) {
  return prisma.repositoryPermission.findMany(params);
}

/**
 * @param {RepositoryPermissionFindUniqueArgs} params
 * @returns {Promise<RepositoryPermission | null>}
 */
function findUnique(params) {
  return prisma.repositoryPermission.findUnique(params);
}

/**
 * @param {string} institutionId
 * @param {string} pattern
 * @param {string} username
 * @returns {Promise<RepositoryPermission | null>}
 */
function findById(institutionId, pattern, username) {
  return prisma.repositoryPermission.findUnique({
    where: {
      username_institutionId_repositoryPattern: {
        username,
        institutionId,
        repositoryPattern: pattern,
      },
    },
  });
}

/**
 * @param {RepositoryPermissionUpdateArgs} params
 * @returns {Promise<RepositoryPermission>}
 */
function update(params) {
  return prisma.repositoryPermission.update(params);
}

/**
 * @param {RepositoryPermissionUpsertArgs} params
 * @returns {Promise<RepositoryPermission>}
 */
function upsert(params) {
  return prisma.repositoryPermission.upsert(params);
}

/**
 * @param {RepositoryPermissionDeleteArgs} params
 * @returns {Promise<RepositoryPermission | null>}
 */
async function remove(params) {
  let permission;
  try {
    permission = await prisma.repositoryPermission.delete(params);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }

  return permission;
}

async function removeAll() {
  if (process.env.NODE_ENV === 'production') { return null; }

  const permissions = await findMany({});

  if (permissions.length === 0) { return null; }

  await Promise.all(permissions.map(async (permission) => {
    await remove({
      where: {
        username_institutionId_repositoryPattern: {
          username: permission.username,
          institutionId: permission.institutionId,
          repositoryPattern: permission.repositoryPattern,
        },
      },
    });
  }));

  return permissions;
}

module.exports = {
  create,
  findMany,
  findUnique,
  findById,
  update,
  upsert,
  remove,
  removeAll,
};
