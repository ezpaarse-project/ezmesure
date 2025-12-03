import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';
import UsersService from '../../../lib/entities/users.service';

const adminFullName = config.get('admin.fullName');
const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[users]: Test read users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  let adminToken;

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await (new UsersService()).generateToken(adminUsername, adminPassword);
  });
  describe('As admin', () => {
    describe('Get all users', () => {
      it('#01 Should get all users', async () => {
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
        await usersPrisma.create({ data: userTest });
        await usersElastic.createUser(userTest);
      });

      it(`#02 Should get user [${userTest.username}]`, async () => {
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
        const usersFromService = await usersPrisma.findByUsername(usernameNotExist);
        expect(usersFromService).toEqual(null);
      });
    });
    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });

  describe('As user', () => {
    let userToken;
    beforeEach(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await (new UsersService()).generateToken(userTest.username, userTest.password);
    });

    describe('Get all users', () => {
      it('#04 Should get all users', async () => {
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
      it(`#05 Should get user [${userTest.username}]`, async () => {
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

    afterEach(async () => {
      await usersPrisma.removeAll();
    });
  });

  describe('With random token', () => {
    beforeEach(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
    });
    describe('Get all users', () => {
      it('#06 Should not get users', async () => {
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
        const userFromService = await usersPrisma.findByUsername(userTest.username);

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
      });
    });

    describe(`Get user with username [${userTest.username}]`, () => {
      it(`#07 Should get user [${userTest.username}]`, async () => {
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
        const userFromService = await usersPrisma.findByUsername(userTest.username);

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
      });
    });
    afterEach(async () => {
      await usersPrisma.removeAll();
    });
  });

  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
