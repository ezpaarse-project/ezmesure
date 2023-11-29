const config = require('config');

const adminUsername = config.get('admin.username');

const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');

const { createUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test delete users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    describe(`Delete user [${userTest.username}]`, () => {
      beforeAll(async () => {
        await createUserAsAdmin(
          userTest.username,
          userTest.email,
          userTest.fullName,
          userTest.isAdmin,
        );
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
        const usersFromService = await usersService.findMany(
          { where: { NOT: { username: adminUsername } } },
        );
        expect(usersFromService).toEqual([]);
      });

      afterAll(async () => {
        await usersService.deleteAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Delete user [${userTest.username}]`, () => {
      beforeAll(async () => {
        await createUserAsAdmin(
          userTest.username,
          userTest.email,
          userTest.fullName,
          userTest.isAdmin,
        );
      });

      it(`#02 Should not delete [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/users/${userTest.username}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

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
        await usersService.deleteAll();
      });
    });
  });
});
