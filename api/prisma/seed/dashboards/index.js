// @ts-check
const { glob, readFile } = require('node:fs/promises');
const { join } = require('node:path');

const { client } = require('../_client');

/* eslint-disable max-len */
/**
 * @typedef {import('../../../lib/.prisma/models.mts').DashboardCreateInput} DashboardCreateInput
 * @typedef {import('../../../lib/.prisma/models.mts').DashboardUpdateInput} DashboardUpdateInput
 * @typedef {import('../../../lib/.prisma/models.mts').DashboardCollectionCreateInput} DashboardCollectionCreateInput
 * @typedef {import('../../../lib/.prisma/models.mts').DashboardCollectionUpdateInput} DashboardCollectionUpdateInput
 */
/* eslint-enable max-len */

async function createCOUNTERCollectionEN() {
  /** @type {DashboardCollectionCreateInput & DashboardCollectionUpdateInput} */
  const collectionData = {
    id: 'counter-base-en',
    name: 'COUNTER (EN)',
  };

  await client.dashboardCollection.upsert({
    where: { id: collectionData.id },
    update: collectionData,
    create: collectionData,
  });

  let count = 0;

  // eslint-disable-next-line no-restricted-syntax
  for await (const path of glob(join(__dirname, './counter-base-en/*.json'))) {
    /** @type {DashboardCreateInput & DashboardUpdateInput} */
    const dashboardData = {
      ...JSON.parse(await readFile(path, 'utf8')),
      collection: {
        connect: { id: collectionData.id },
      },
    };

    await client.dashboard.upsert({
      where: { id: dashboardData.id },
      update: dashboardData,
      create: dashboardData,
    });

    count += 1;
  }

  return count;
}

module.exports = {
  createDashboards: async () => {
    let count = 0;

    count += await createCOUNTERCollectionEN();

    return count;
  },
};
