const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersService = require('../../../lib/entities/users.service');
const usersElastic = require('../../../lib/services/elastic/users');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[users]: Test delete users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  let adminToken;

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await usersService.generateToken(adminUsername, adminPassword);
  });
  describe('As admin', () => {
    describe(`Delete user [${userTest.username}]`, () => {
      beforeAll(async () => {
        await usersPrisma.create({ data: userTest });
        await usersElastic.createUser(userTest);
      });

      it(`#01 Should delete [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/users/${userTest.username}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        // Test users service
        const usersFromService = await usersPrisma.findMany(
          { where: { NOT: { username: adminUsername } } },
        );
        expect(usersFromService).toEqual([]);
      });

      afterAll(async () => {
        await usersPrisma.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Delete user [${userTest.username}]`, () => {
      beforeAll(async () => {
        await usersPrisma.create({ data: userTest });
        await usersElastic.createUser(userTest);
      });

      it(`#02 Should not delete [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/users/${userTest.username}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const userFromService = await usersPrisma.findByUsername(userTest.username);

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
      });

      afterAll(async () => {
        await usersPrisma.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
