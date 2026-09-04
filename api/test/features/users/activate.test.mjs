import {
  describe, it, expect, beforeAll, afterAll,
} from 'vitest';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';
import { signJWT } from '../../../lib/utils/jwt';

import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';

describe('[users]: Test activate users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const data = {
    acceptTerms: true,
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
  describe('As user', () => {
    describe(`activate new user [${userTest.username}] with user-test token`, () => {
      let userToken;

      beforeAll(async () => {
        await usersPrisma.create({ data: userTest });
        await usersElastic.createUser(userTest);
        userToken = await signJWT({ username: userTest.username });
      });

      it(`#01 Should activate user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure.raw('/auth/_activate', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          body: data,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        // Test user service
        const userFromService = await usersPrisma.findByUsername('user.test');

        expect(userFromService).toMatchObject({
          id: expect.any(String),
          username: userTest.username,
          fullName: userTest.fullName,
          email: userTest.email,
          isAdmin: false,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          lastActivity: expect.any(Date),
          metadata: {},
        });
      });

      afterAll(async () => {
        await usersPrisma.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
