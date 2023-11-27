const config = require('config');

const adminFullName = config.get('admin.fullName');
const adminUsername = config.get('admin.username');

const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');

const { createUserAsAdmin } = require('../../setup/users');
const { getAdminToken, getToken } = require('../../setup/login');

describe('[users]: Test users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    describe('Get all users', () => {
      it('#01 GET /users - Should get all users', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/users',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        expect(httpAppResponse?.data).toEqual([
          { fullName: adminFullName, username: adminUsername },
        ]);
      });
    });

    describe(`Get user with username [${userTest.username}]`, () => {
      beforeAll(async () => {
        await createUserAsAdmin(
          userTest.username,
          userTest.email,
          userTest.fullName,
          userTest.isAdmin,
        );
      });

      it(`#02 GET /users/${userTest.username} - Should get user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/users/${userTest.username}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const user = httpAppResponse?.data;

        expect(user).toHaveProperty('username', userTest.username);
        expect(user).toHaveProperty('fullName', userTest.fullName);
        expect(user).toHaveProperty('email', userTest.email);
        expect(user).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(user?.createdAt).not.toBeNull();
        expect(user?.updatedAt).not.toBeNull();
      });
    });

    describe('Get user that does not exist', () => {
      const usernameNotExist = 'random';
      it(`#03 GET /users/random - Should get user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/users/random',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 404);

        // Test users service
        const usersFromService = await usersService.findByUsername(usernameNotExist);
        expect(usersFromService).toEqual(null);
      });
    });
    afterAll(async () => {
      await usersService.deleteAll();
    });
  });

  describe('As user', () => {
    let userToken;
    beforeAll(async () => {
      await createUserAsAdmin(
        userTest.username,
        userTest.email,
        userTest.fullName,
        userTest.isAdmin,
      );
      userToken = await getToken(userTest.username, userTest.password);
    });

    describe('Get all users', () => {
      it('#04 GET /users - Should get all users', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/users',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        expect(httpAppResponse?.data).toEqual([
          { fullName: adminFullName, username: adminUsername },
          { fullName: userTest.fullName, username: userTest.username },
        ]);
      });
    });

    describe(`Get user with username [${userTest.username}]`, () => {
      beforeAll(async () => {
        await createUserAsAdmin(
          userTest.username,
          userTest.email,
          userTest.fullName,
          userTest.isAdmin,
        );
      });

      it(`#05 GET /users/${userTest.username} - Should get user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/users/${userTest.username}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const user = httpAppResponse?.data;

        expect(user).toHaveProperty('username', userTest.username);
        expect(user).toHaveProperty('fullName', userTest.fullName);
        expect(user).toHaveProperty('email', userTest.email);
        expect(user).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(user?.createdAt).not.toBeNull();
        expect(user?.updatedAt).not.toBeNull();
      });
    });
  });

  describe('With random token', () => {
    describe('Get all users', () => {
      it('#06 GET /users - Should not get users', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/users',
          headers: {
            Authorization: 'Bearer random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test users service
        const userFromService = await usersService.findByUsername(userTest.username);

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
      });
    });

    describe(`Get user with username [${userTest.username}]`, () => {
      beforeAll(async () => {
        await createUserAsAdmin(
          userTest.username,
          userTest.email,
          userTest.fullName,
          userTest.isAdmin,
        );
      });

      it(`#07 GET /users/${userTest.username} - Should get user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/users/${userTest.username}`,
          headers: {
            Authorization: 'Bearer random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test users service
        const userFromService = await usersService.findByUsername(userTest.username);

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
      });

      afterAll(async () => {
        await usersService.deleteAll();
      });
    });
  });

  describe('Without token', () => {
    describe('Get all users', () => {
      beforeAll(async () => {
        await createUserAsAdmin(
          userTest.username,
          userTest.email,
          userTest.fullName,
          userTest.isAdmin,
        );
      });
      it('#08 GET /users - Should not get users', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/users',
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test users service
        const userFromService = await usersService.findByUsername(userTest.username);

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
      });
    });

    describe(`Get user with username [${userTest.username}]`, () => {
      beforeAll(async () => {
        await createUserAsAdmin(
          userTest.username,
          userTest.email,
          userTest.fullName,
          userTest.isAdmin,
        );
      });

      it(`#09 GET /users/${userTest.username} - Should get user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/users/${userTest.username}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test users service
        const userFromService = await usersService.findByUsername(userTest.username);

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
      });

      afterAll(async () => {
        await usersService.deleteAll();
      });
    });
  });
});
