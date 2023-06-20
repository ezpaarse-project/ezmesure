const ezmesure = require('./setup/ezmesure');

const { createUserAsAdmin, deleteUserAsAdmin } = require('./setup/users');
const { getAdminToken } = require('./setup/login');

describe('[users]: Test users features', () => {
  describe('Read', () => {
    describe('GET /users - Get all users with ezmesure-admin token', () => {
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

    describe('GET /users/user.test - Get user with his username "user.test" with ezmesure-admin token', () => {
      let token;
      beforeAll(async () => {
        token = await getAdminToken();
        await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
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
        await deleteUserAsAdmin('user.test');
      });
    });

    describe('GET /users/user-test - Get a user that doesn\'t exist with ezmesure-admin token', () => {
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

    describe('Security', () => {
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
        beforeAll(async () => {
          await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
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
          await deleteUserAsAdmin('user.test');
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

  describe('Create', () => {
    describe('PUT /users/user.test - Create new user "user.test" with ezmesure-admin token', () => {
      let token;
      beforeAll(async () => {
        token = await getAdminToken();
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
        await deleteUserAsAdmin('user.test');
      });
    });
    describe('Security', () => {
      describe('PUT /users/user.test - Create new user without token', () => {
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

  describe('Update', () => {
    describe('PUT /users/user.test - Update user "user.test" with ezmesure-admin token', () => {
      let token;
      beforeAll(async () => {
        token = await getAdminToken();
        await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
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
        await deleteUserAsAdmin('user.test');
      });
    });
    describe('Security', () => {
      describe('PUT /users/user.test - Update user "user.test" without token', () => {
        beforeAll(async () => {
          await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
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

        afterAll(async () => {
          await deleteUserAsAdmin('user.test');
        });
      });
    });
  });

  describe('Delete', () => {
    describe('PUT /users/user.test - Delete user "user.test" with ezmesure-admin token', () => {
      let token;
      beforeAll(async () => {
        token = await getAdminToken();
        await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
      });

      it('Should delete ', async () => {
        let res;
        try {
          res = await ezmesure({
            method: 'DELETE',
            url: '/users/user-test',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (err) {
          res = err?.response;
        }

        expect(res).toHaveProperty('status', 200);
      });

      afterAll(async () => {
        await deleteUserAsAdmin('user.test');
      });
    });
    describe('Security', () => {
      describe('PUT /users/user.test - Delete user "user.test" without token', () => {
        beforeAll(async () => {
          await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
        });

        it('Should delete ', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'DELETE',
              url: '/users/user-test',
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteUserAsAdmin('user.test');
        });
      });
    });
  });
});
