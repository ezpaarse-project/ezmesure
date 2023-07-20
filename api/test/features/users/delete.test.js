const ezmesure = require('../../setup/ezmesure');

const { createUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test delete users features', () => {
  describe('As admin', () => {
    describe('DELETE /users/user.test - Delete user [user.test]', () => {
      let adminToken;
      let userTest;

      beforeAll(async () => {
        adminToken = await getAdminToken();
        userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
      });

      it('Should delete [user.test]', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: '/users/user-test',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        expect(res).toHaveProperty('status', 200);
      });

      afterAll(async () => {
        await deleteUserAsAdmin(userTest.username);
      });
    });
  });
  describe('Without token', () => {
    describe('DELETE /users/user.test - Delete user [user.test]', () => {
      let adminToken;
      let userTest;
      beforeAll(async () => {
        adminToken = await getAdminToken();
        userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
      });

      it('Should delete [user.test]', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: '/users/user-test',
        });

        expect(res).toHaveProperty('status', 401);
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
