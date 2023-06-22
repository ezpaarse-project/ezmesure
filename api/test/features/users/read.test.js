const ezmesure = require('../../setup/ezmesure');

const { createUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test users features', () => {
  describe('Read', () => {
    describe('Admin', () => {
      describe('GET /users - Get all users with admin token', () => {
        let token;
        beforeAll(async () => {
          token = await getAdminToken();
        });

        it('Should get all users', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: '/users',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
          }
          expect(res).toHaveProperty('status', 200);

          expect(res?.data).toEqual([{ fullName: 'ezMESURE Administrator', username: 'ezmesure-admin' }]);
        });
      });

      describe('GET /users/user.test - Get user with his username "user.test" with admin token', () => {
        let token;
        let userTest;

        beforeAll(async () => {
          token = await getAdminToken();
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should get user "user.test"', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: '/users/user.test',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 200);

          const user = res?.data;

          expect(user).toHaveProperty('username', 'user.test');
          expect(user).toHaveProperty('fullName', 'User test');
          expect(user).toHaveProperty('email', 'user.test@test.fr');
          expect(user).toHaveProperty('isAdmin', false);
          expect(user?.createdAt).not.toBeNull();
          expect(user?.updatedAt).not.toBeNull();
        });

        afterAll(async () => {
          await deleteUserAsAdmin(userTest.username);
        });
      });

      describe('GET /users/user-test - Get a user that doesn\'t exist with admin token', () => {
        let token;
        beforeAll(async () => {
          token = await getAdminToken();
        });

        it('Should get HTTP status 404', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: '/users/user-test',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
          }
          expect(res).toHaveProperty('status', 404);
        });
      });
    });

    describe('Without token', () => {
      describe('GET /users - Get all users without token', () => {
        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: '/users',
            });
          } catch (err) {
            res = err?.response;
          }
          expect(res).toHaveProperty('status', 401);
        });
      });

      describe('GET /users/user.test - Get user with his username "user.test" without token', () => {
        let userTest;
        beforeAll(async () => {
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: '/users/user.test',
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteUserAsAdmin(userTest.username);
        });
      });

      describe('GET /users - Get all users with user-test token', () => {
        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: '/users',
            });
          } catch (err) {
            res = err?.response;
          }
          expect(res).toHaveProperty('status', 401);
        });
      });
    });
  });
});
