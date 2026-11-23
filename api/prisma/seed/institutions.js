// @ts-check
const config = require('config');

const { client } = require('./_client');

/* eslint-disable max-len */
/**
 * @typedef {import('../../lib/.prisma/models.mts').SushiCredentialsCreateInput} SushiCredentialsCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').SushiCredentialsUpdateInput} SushiCredentialsUpdateInput
 * @typedef {import('../../lib/.prisma/models.mts').MembershipCreateInput} MembershipCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').MembershipUpdateInput} MembershipUpdateInput
 * @typedef {import('../../lib/.prisma/models.mts').InstitutionCreateInput} InstitutionCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').InstitutionUpdateInput} InstitutionUpdateInput
 */
/* eslint-enable max-len */

async function createAdminInstitution() {
  const { username } = config.get('admin');

  /** @type {InstitutionCreateInput & InstitutionUpdateInput} */
  const institutionData = {
    id: 'admin',
    name: 'Administration',
    sushiReadySince: new Date(),
    validated: true,
  };

  await client.institution.upsert({
    where: { id: institutionData.id },
    update: institutionData,
    create: institutionData,
  });

  /** @type {SushiCredentialsCreateInput & SushiCredentialsUpdateInput} */
  const sushiCredentialsData = {
    id: 'admin-springer-demo',
    customerId: '3000093925',
    apiKey: 'kLibyHnf4wDjkvkt37MUxXQcdZYnVsYH',

    institution: { connect: { id: institutionData.id } },
    endpoint: { connect: { id: 'springer-demo' } },
  };

  await client.sushiCredentials.upsert({
    where: { id: sushiCredentialsData.id },
    update: sushiCredentialsData,
    create: sushiCredentialsData,
  });

  /** @type {MembershipCreateInput & MembershipUpdateInput} */
  const membershipData = {
    locked: true,
    permissions: [
      'institution:write',
      'memberships:write',
      'sushi:write',
      'reporting:write',
    ],

    institution: { connect: { id: institutionData.id } },
    user: { connect: { username } },
  };

  await client.membership.upsert({
    where: {
      username_institutionId: {
        institutionId: 'admin',
        username,
      },
    },
    update: membershipData,
    create: membershipData,
  });
}

module.exports = {
  createInstitutions: async () => {
    await createAdminInstitution();

    return 1;
  },
};
