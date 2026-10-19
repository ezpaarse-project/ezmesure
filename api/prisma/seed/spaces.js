// @ts-check
const config = require('config');

const { client } = require('./_client');

/* eslint-disable max-len */
/**
 * @typedef {import('../../lib/.prisma/models.mts').SpaceCreateInput} SpaceCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').SpaceUpdateInput} SpaceUpdateInput
 * @typedef {import('../../lib/.prisma/models.mts').SpacePermissionCreateInput} SpacePermissionCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').SpacePermissionUpdateInput} SpacePermissionUpdateInput
 * @typedef {import('../../lib/.prisma/models.mts').SpaceDashboardCollectionCreateInput} SpaceDashboardCollectionCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').SpaceDashboardCollectionUpdateInput} SpaceDashboardCollectionUpdateInput
 */
/* eslint-enable max-len */

async function createAdminSpace() {
  const { username } = config.get('admin');

  /** @type {SpaceCreateInput & SpaceUpdateInput} */
  const spaceData = {
    id: 'z-admin-publisher',
    name: 'Administration (counter5)',
    type: 'counter5',

    institution: { connect: { id: 'admin' } },
  };

  await client.space.upsert({
    where: { id: spaceData.id },
    update: spaceData,
    create: spaceData,
  });

  /** @type {SpacePermissionCreateInput & SpacePermissionUpdateInput} */
  const permissionData = {
    readonly: false,
    locked: true,

    space: { connect: { id: spaceData.id } },

    membership: {
      connect: {
        username_institutionId: {
          username,
          institutionId: 'admin',
        },
      },
    },
  };

  await client.spacePermission.upsert({
    where: {
      username_spaceId: {
        spaceId: spaceData.id,
        username: 'admin',
      },
    },
    update: permissionData,
    create: permissionData,
  });

  /** @type {SpaceDashboardCollectionCreateInput & SpaceDashboardCollectionUpdateInput} */
  const collectionData = {
    space: { connect: { id: spaceData.id } },
    collection: { connect: { id: 'counter-base-en' } },
    repository: { connect: { pattern: 'z-admin-publisher*' } },
  };

  await client.spaceDashboardCollection.upsert({
    where: {
      collectionId_spaceId_repositoryPattern: {
        spaceId: spaceData.id,
        collectionId: 'counter-base-en',
        repositoryPattern: 'z-admin-publisher*',
      },
    },
    update: collectionData,
    create: collectionData,
  });
}

module.exports = {
  createSpaces: async () => {
    await createAdminSpace();

    return 1;
  },
};
