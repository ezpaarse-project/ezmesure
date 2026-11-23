// @ts-check
const config = require('config');

const { client } = require('./_client');

/* eslint-disable max-len */
/**
 * @typedef {import('../../lib/.prisma/models.mts').UserCreateInput} UserCreateInput
 * @typedef {import('../../lib/.prisma/models.mts').UserUpdateInput} UserUpdateInput
 */
/* eslint-enable max-len */

async function createAdminUser() {
  const { username, email, fullName } = config.get('admin');

  /** @type {UserCreateInput & UserUpdateInput} */
  const data = {
    username,
    email,
    fullName,
    isAdmin: true,
    acceptedTerms: true,
  };

  await client.user.upsert({
    where: { username },
    update: data,
    create: data,
  });
}

module.exports = {
  createUsers: async () => {
    await createAdminUser();

    return 1;
  },
};
