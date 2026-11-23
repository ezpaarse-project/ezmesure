// @ts-check
const config = require('config');

const { client } = require('./_client');

/* eslint-disable max-len */
/**
 * @typedef {import('../../lib/.prisma/models.mts').RepositoryCreateInput} RepositoryCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').RepositoryUpdateInput} RepositoryUpdateInput
 * @typedef {import('../../lib/.prisma/models.mts').RepositoryPermissionCreateInput} RepositoryPermissionCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').RepositoryPermissionUpdateInput} RepositoryPermissionUpdateInput
 */
/* eslint-enable max-len */

async function createAdminRepository() {
  const { username } = config.get('admin');

  /** @type {RepositoryCreateInput & RepositoryUpdateInput} */
  const repositoryData = {
    pattern: 'z-admin-publisher*',
    type: 'counter5',

    institutions: { connect: { id: 'admin' } },
  };

  await client.repository.upsert({
    where: { pattern: repositoryData.pattern },
    update: repositoryData,
    create: repositoryData,
  });

  /** @type {RepositoryPermissionCreateInput & RepositoryPermissionUpdateInput} */
  const permissionData = {
    readonly: false,
    locked: true,

    repository: { connect: { pattern: repositoryData.pattern } },

    membership: {
      connect: {
        username_institutionId: {
          username,
          institutionId: 'admin',
        },
      },
    },
  };

  await client.repositoryPermission.upsert({
    where: {
      username_institutionId_repositoryPattern: {
        repositoryPattern: repositoryData.pattern,
        institutionId: 'admin',
        username,
      },
    },
    update: permissionData,
    create: permissionData,
  });
}

module.exports = {
  createRepositories: async () => {
    await createAdminRepository();

    return 1;
  },
};
