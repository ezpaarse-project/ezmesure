const ezmesure = require('../../setup/ezmesure');

const { createUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test users features', () => {
  describe('Update', () => {
    describe('As admin', () => {
      describe('PUT /users/user.test - Update user [user.test]', () => {
        let adminToken;
        let userTest;
        beforeAll(async () => {
          adminToken = await getAdminToken();
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should create new user [user.test]', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: '/users/user.test',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: {
              username: 'user.test',
              email: 'user2.test@test.fr',
              fullName: 'User2 test',
              isAdmin: false,
            },
          });

          expect(res).toHaveProperty('status', 200);
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
      describe('PUT /users/user.test - Update user [user.test]', () => {
        let adminToken;
        let userTest;
        beforeAll(async () => {
          adminToken = await getAdminToken();
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: '/users/user.test',
            data: {
              email: 'user2.test@test.fr',
              fullName: 'User2 test',
              isAdmin: false,
            },
          });

          expect(res).toHaveProperty('status', 401);
        });

        it('Should get user [user.test] with any change', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: '/users/user.test',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

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
