const ezmesure = require('../../setup/ezmesure');

const { createUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test users features', () => {
  const userTestUpdated = {
    username: 'user.test',
    email: 'user2.test@test.fr',
    fullName: 'User2 test',
    isAdmin: false,
  };
  describe('Update', () => {
    describe('As admin', () => {
      describe('PUT /users/user.test - Update user [user.test]', () => {
        let adminToken;
        let userTest;
        beforeAll(async () => {
          adminToken = await getAdminToken();
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should update user [user.test]', async () => {
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

          expect(user).toHaveProperty('username', userTestUpdated.username);
          expect(user).toHaveProperty('fullName', userTestUpdated.fullName);
          expect(user).toHaveProperty('email', userTestUpdated.email);
          expect(user).toHaveProperty('isAdmin', userTestUpdated.isAdmin);
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
    });
  });
});
