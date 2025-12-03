import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[users]: Test login users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const userPassword = 'changeme';

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
  describe('Login with admin account', () => {
    it('#01 Should get auth token', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/login/local',
        data: {
          username: adminUsername,
          password: adminPassword,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);
    });
  });

  describe('Activated user', () => {
    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      await usersElastic.updatePassword(userTest.username, userPassword);
      await usersPrisma.acceptTerms(userTest.username);
    });

    it('#02 Should get auth token', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/login/local',
        data: {
          username: userTest.username,
          password: userPassword,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);
    });

    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });

  describe('Not activated user', () => {
    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      await usersElastic.updatePassword(userTest.username, userPassword);
    });

    it('#03 Should get auth token', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/login/local',
        data: {
          username: userTest.username,
          password: userPassword,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);
    });

    afterAll(async () => {
      await usersPrisma.removeAll();
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
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
