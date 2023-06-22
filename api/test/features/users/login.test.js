const config = require('config');
const ezmesure = require('../../setup/ezmesure');

const usernameAdmin = config.get('admin.username');
const passwordAdmin = config.get('admin.password');

const {
  createDefaultActivatedUserAsAdmin,
  createDefaultUserAsAdmin,
  deleteUserAsAdmin,
} = require('../../setup/users');

describe('[users]: Test users features', () => {
  describe('Login', () => {
    describe('Admin', () => {
      describe('POST /login/local - Login with admin account', () => {
        it('Should get auth token', async () => {
          let res;

          try {
            res = await ezmesure({
              method: 'POST',
              url: '/login/local',
              data: {
                username: usernameAdmin,
                password: passwordAdmin,
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 200);
        });
      });
    });

    describe('Activated user', () => {
      describe('POST /login/local - Login with activate user [user.test] account', () => {
        let userTest;

        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
        });

        it('Should get auth token', async () => {
          let res;

          try {
            res = await ezmesure({
              method: 'POST',
              url: '/login/local',
              data: {
                username: userTest.username,
                password: userTest.password,
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });

    describe('Not activated user', () => {
      describe('POST /login/local - Login with not activate user [user.test] account', () => {
        let userTest;
        beforeAll(async () => {
          userTest = await createDefaultUserAsAdmin();
        });

        it('Should get HTTP status 401', async () => {
          let res;

          try {
            res = await ezmesure({
              method: 'POST',
              url: '/login/local',
              data: {
                username: userTest.username,
                password: userTest.password,
              },
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
    });

    describe('Someone not registered', () => {
      describe('POST /login/local - Login with not activate user [user.test] account', () => {
        it('Should get HTTP status 401', async () => {
          let res;

          try {
            res = await ezmesure({
              method: 'POST',
              url: '/login/local',
              data: {
                username: 'toto',
                password: 'titi',
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
