const ezmesure = require('../../setup/ezmesure');

const { createUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test users features', () => {
  describe('Update', () => {
    describe('Admin', () => {
      describe('PUT /users/user.test - Update user "user.test" with admin token', () => {
        let token;
        let userTest;
        beforeAll(async () => {
          token = await getAdminToken();
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should create new user "user.test"', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'PUT',
              url: '/users/user.test',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              data: {
                username: 'user.test',
                email: 'user2.test@test.fr',
                fullName: 'User2 test',
                isAdmin: false,
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 200);
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
          expect(user).toHaveProperty('fullName', 'User2 test');
          expect(user).toHaveProperty('email', 'user2.test@test.fr');
          expect(user).toHaveProperty('isAdmin', false);
          expect(user?.createdAt).not.toBeNull();
          expect(user?.updatedAt).not.toBeNull();
        });

        afterAll(async () => {
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });
    describe('Without token', () => {
      describe('PUT /users/user.test - Update user "user.test" without token', () => {
        let token;
        let userTest;
        beforeAll(async () => {
          token = await getAdminToken();
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'PUT',
              url: '/users/user.test',
              data: {
                email: 'user2.test@test.fr',
                fullName: 'User2 test',
                isAdmin: false,
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 401);
        });

        it('Should get user "user.test" with any change', async () => {
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
    });
  });
});
