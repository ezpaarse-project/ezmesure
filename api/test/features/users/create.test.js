const ezmesure = require('../../setup/ezmesure');

const { deleteUserAsAdmin } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[users]: Test users features', () => {
  describe('Create', () => {
    describe('As admin', () => {
      describe('PUT /users/user.test - Create new user "user.test"', () => {
        let token;
        const username = 'user.test';

        beforeAll(async () => {
          token = await getAdminToken();
        });

        it('Should create new user "user.test"', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'PUT',
              url: `/users/${username}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
              data: {
                username: 'user.test',
                email: 'user.test@test.fr',
                fullName: 'User test',
                isAdmin: false,
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 201);
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
          await deleteUserAsAdmin(username);
        });
      });
    });
    describe('Without token', () => {
      describe('PUT /users/user.test - Create new user', () => {
        it('Should create new user "user.test"', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'PUT',
              url: '/users/user.test',
              data: {
                username: 'user.test',
                email: 'user.test@test.fr',
                fullName: 'User test',
                isAdmin: false,
              },
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
