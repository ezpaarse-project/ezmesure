const config = require('config');

const adminUsername = config.get('admin.username');

const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');

const { getAdminToken } = require('../../setup/login');
const { resetDatabase } = require('../../../lib/services/prisma/utils');

describe('[users]: Test create users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  beforeAll(async () => {
    await resetDatabase();
  });
  describe('As admin', () => {
    describe(`Create new user [${userTest.username}]`, () => {
      let adminToken;

      beforeAll(async () => {
        adminToken = await getAdminToken();
      });

      it(`#01 Should create new user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/users/${userTest.username}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: userTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 201);

        // Test service
        const userFromService = await usersService.findByUsername(userTest.username);

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
      });

      afterAll(async () => {
        await usersService.removeAll();
      });
    });
  });
  describe('With random token', () => {
    describe('Create new user', () => {
      it(`#02 Should not create new user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/users/${userTest.username}`,
          data: userTest,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test users service
        const usersFromService = await usersService.findMany(
          { where: { NOT: { username: adminUsername } } },
        );
        expect(usersFromService).toEqual([]);
      });
    });
  });
  describe('Without token', () => {
    describe('Create new user', () => {
      it(`#03 Should not create new user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/users/${userTest.username}`,
          data: userTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test users service
        const usersFromService = await usersService.findMany(
          { where: { NOT: { username: adminUsername } } },
        );
        expect(usersFromService).toEqual([]);
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
  });
});
