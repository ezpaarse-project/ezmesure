// @ts-check
const { client } = require('./_client');

/* eslint-disable max-len */
/**
 * @typedef {import('../../lib/.prisma/models.mts').SushiEndpointCreateInput} SushiEndpointCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').SushiEndpointUpdateInput} SushiEndpointUpdateInput
 */
/* eslint-enable max-len */

async function createTestEndpoint() {
  /** @type {SushiEndpointCreateInput & SushiEndpointUpdateInput} */
  const data = {
    id: 'springer-demo',
    sushiUrl: 'https://counter.public.springernature.app',
    vendor: 'Springer Nature - Demo',
    tags: ['Demo'],
    counterVersions: ['5', '5.1'],
  };

  await client.sushiEndpoint.upsert({
    where: { id: data.id },
    update: data,
    create: data,
  });
}

module.exports = {
  createEndpoints: async () => {
    await createTestEndpoint();

    return 1;
  },
};
