const ezmesure = require('../../setup/ezmesure');

const { deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test create users features', () => {
  describe('As admin', () => {
    describe('PUT /users/user.test - Create new user [user.test]', () => {
      let adminToken;
      const username = 'user.test';

      beforeAll(async () => {
        adminToken = await getAdminToken();
      });

      it('Should create new user [user.test]', async () => {
        const res = await ezmesure({
          method: 'PUT',
          url: `/users/${username}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: {
            username: 'user.test',
            email: 'user.test@test.fr',
            fullName: 'User test',
            isAdmin: false,
          },
        });

        expect(res).toHaveProperty('status', 201);
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
        await deleteUserAsAdmin(username);
      });
    });
  });
  describe('Without token', () => {
    describe('PUT /users/user.test - Create new user', () => {
      it('Should create new user [user.test]', async () => {
        const res = await ezmesure({
          method: 'PUT',
          url: '/users/user.test',
          data: {
            username: 'user.test',
            email: 'user.test@test.fr',
            fullName: 'User test',
            isAdmin: false,
          },
        });
        expect(res).toHaveProperty('status', 401);
      });
    });
  });
});
