const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const UsersService = require('../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[users]: Test update users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const userTestUpdated = {
    username: 'user.test',
    email: 'user2.test@test.fr',
    fullName: 'User2 test',
    isAdmin: false,
  };

  let adminToken;

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await UsersService.generateToken(adminUsername, adminPassword);
  });
  describe('Update', () => {
    describe('As admin', () => {
      describe(`Update user [${userTest.username}]`, () => {
        beforeAll(async () => {
          await usersPrisma.create({ data: userTest });
          await usersElastic.createUser(userTest);
        });

        it(`#01 Should update user [${userTest.username}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/users/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: userTestUpdated,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          // Test service
          const userFromService = await usersPrisma.findByUsername(userTest.username);

          expect(userFromService).toHaveProperty('username', userTestUpdated.username);
          expect(userFromService).toHaveProperty('fullName', userTestUpdated.fullName);
          expect(userFromService).toHaveProperty('email', userTestUpdated.email);
          expect(userFromService).toHaveProperty('isAdmin', userTestUpdated.isAdmin);
          expect(userFromService?.createdAt).not.toBeNull();
          expect(userFromService?.updatedAt).not.toBeNull();
        });

        afterAll(async () => {
          await usersPrisma.removeAll();
        });
      });
    });
    describe('With random token', () => {
      describe(`Update user [${userTest.username}]`, () => {
        beforeAll(async () => {
          await usersPrisma.create({ data: userTest });
          await usersElastic.createUser(userTest);
        });

        it(`#02 Should not update [${userTest.username}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/users/${userTest.username}`,
            data: userTestUpdated,
            headers: {
              Authorization: 'Bearer: random',
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 401);

          // Test service
          const userFromService = await usersPrisma.findByUsername(userTest.username);

          expect(userFromService).toHaveProperty('username', userTest.username);
          expect(userFromService).toHaveProperty('fullName', userTest.fullName);
          expect(userFromService).toHaveProperty('email', userTest.email);
          expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
          expect(userFromService?.createdAt).not.toBeNull();
          expect(userFromService?.updatedAt).not.toBeNull();
        });

        afterAll(async () => {
          await usersPrisma.removeAll();
        });
      });
    });
    describe('Without token', () => {
      describe(`Update user [${userTest.username}]`, () => {
        beforeAll(async () => {
          await usersPrisma.create({ data: userTest });
          await usersElastic.createUser(userTest);
        });

        it(`#03 Should not update [${userTest.username}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/users/${userTest.username}`,
            data: userTestUpdated,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 401);

          // Test service
          const userFromService = await usersPrisma.findByUsername(userTest.username);

          expect(userFromService).toHaveProperty('username', userTest.username);
          expect(userFromService).toHaveProperty('fullName', userTest.fullName);
          expect(userFromService).toHaveProperty('email', userTest.email);
          expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
          expect(userFromService?.createdAt).not.toBeNull();
          expect(userFromService?.updatedAt).not.toBeNull();
        });

        afterAll(async () => {
          await usersPrisma.removeAll();
        });
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
