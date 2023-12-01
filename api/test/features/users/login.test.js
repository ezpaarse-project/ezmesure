const config = require('config');
const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');

const usernameAdmin = config.get('admin.username');
const passwordAdmin = config.get('admin.password');

const {
  createDefaultActivatedUserAsAdmin,
  createDefaultUserAsAdmin,
} = require('../../setup/users');

describe('[users]: Test login users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
    password: 'changeme',
  };
  describe('Login with admin account', () => {
    it('#01 Should get auth token', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/login/local',
        data: {
          username: usernameAdmin,
          password: passwordAdmin,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);
    });
  });

  describe('Activated user', () => {
    beforeAll(async () => {
      await createDefaultActivatedUserAsAdmin();
    });

    it('#02 Should get auth token', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/login/local',
        data: {
          username: userTest.username,
          password: userTest.password,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);
    });

    afterAll(async () => {
      await usersService.removeAll();
    });
  });

  describe('Not activated user', () => {
    beforeAll(async () => {
      await createDefaultUserAsAdmin();
    });

    it('#03 Should get auth token', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/login/local',
        data: {
          username: userTest.username,
          password: userTest.password,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);
    });

    afterAll(async () => {
      await usersService.removeAll();
    });
  });

  describe('Someone not registered', () => {
    it('#04 Should not get auth token', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/login/local',
        data: {
          username: 'toto',
          password: 'titi',
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
    });
  });
});
