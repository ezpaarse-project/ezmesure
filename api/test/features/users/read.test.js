const ezmesure = require('../../setup/ezmesure');

const { createUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test users features', () => {
  describe('Read', () => {
    describe('As admin', () => {
      describe('GET /users - Get all users', () => {
        let adminToken;
        beforeAll(async () => {
          adminToken = await getAdminToken();
        });

        it('Should get all users', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: '/users',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);

          expect(res?.data).toEqual([{ fullName: 'ezMESURE Administrator', username: 'ezmesure-admin' }]);
        });
      });

      describe('GET /users/user.test - Get user with his username [user.test]', () => {
        let adminToken;
        let userTest;

        beforeAll(async () => {
          adminToken = await getAdminToken();
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should get user [user.test]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: '/users/user.test',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const user = res?.data;

          expect(user).toHaveProperty('username', userTest.username);
          expect(user).toHaveProperty('fullName', userTest.fullName);
          expect(user).toHaveProperty('email', userTest.email);
          expect(user).toHaveProperty('isAdmin', userTest.isAdmin);
          expect(user?.createdAt).not.toBeNull();
          expect(user?.updatedAt).not.toBeNull();
        });

        afterAll(async () => {
          await deleteUserAsAdmin(userTest.username);
        });
      });

      describe('GET /users/user-test - Get a user that doesn\'t exist', () => {
        let adminToken;
        beforeAll(async () => {
          adminToken = await getAdminToken();
        });

        it('Should get HTTP status 404', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: '/users/user-test',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 404);
        });
      });
    });

    describe('Without token', () => {
      describe('GET /users - Get all users', () => {
        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: '/users',
          });
          expect(res).toHaveProperty('status', 401);
        });
      });

      describe('GET /users/user.test - Get user with his username [user.test]', () => {
        let userTest;
        beforeAll(async () => {
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: '/users/user.test',
          });

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteUserAsAdmin(userTest.username);
        });
      });

      describe('GET /users - Get all users with user-test token', () => {
        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: '/users',
          });
          expect(res).toHaveProperty('status', 401);
        });
      });
    });
  });
});
