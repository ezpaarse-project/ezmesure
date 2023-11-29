const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');

const { createUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test update users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const userTestUpdated = {
    username: 'user.test',
    email: 'user2.test@test.fr',
    fullName: 'User2 test',
    isAdmin: false,
  };

  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('Update', () => {
    describe('As admin', () => {
      describe(`Update user [${userTest.username}]`, () => {
        beforeAll(async () => {
          await createUserAsAdmin(
            userTest.username,
            userTest.email,
            userTest.fullName,
            userTest.isAdmin,
          );
        });

        it(`#01 Should update user [${userTest.username}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/users/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: userTestUpdated,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          // Test service
          const userFromService = await usersService.findByUsername(userTest.username);

          expect(userFromService).toHaveProperty('username', userTestUpdated.username);
          expect(userFromService).toHaveProperty('fullName', userTestUpdated.fullName);
          expect(userFromService).toHaveProperty('email', userTestUpdated.email);
          expect(userFromService).toHaveProperty('isAdmin', userTestUpdated.isAdmin);
          expect(userFromService?.createdAt).not.toBeNull();
          expect(userFromService?.updatedAt).not.toBeNull();
        });

        afterAll(async () => {
          await usersService.deleteAll();
        });
      });
    });
    describe('With random token', () => {
      describe(`Update user [${userTest.username}]`, () => {
        beforeAll(async () => {
          await createUserAsAdmin(
            userTest.username,
            userTest.email,
            userTest.fullName,
            userTest.isAdmin,
          );
        });

        it(`#02 Should not update us${userTest.username}rTest.username}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/users/${userTest.username}`,
            data: userTestUpdated,
            headers: {
              Authorization: 'Bearer: random',
            },
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
    describe('Without token', () => {
      describe(`Update user [${userTest.username}]`, () => {
        beforeAll(async () => {
          await createUserAsAdmin(
            userTest.username,
            userTest.email,
            userTest.fullName,
            userTest.isAdmin,
          );
        });

        it(`#03 Should not update us${userTest.username}rTest.username}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/users/${userTest.username}`,
            data: userTestUpdated,
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
});
