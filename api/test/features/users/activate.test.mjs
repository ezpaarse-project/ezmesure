import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';
import UsersService from '../../../lib/entities/users.service';

describe('[users]: Test activate users features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const data = {
    password: 'changeme',
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
        userToken = await UsersService.generateTokenForActivate(userTest.username);
      });

      it(`#01 Should activate user [${userTest.username}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/profile/_activate',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        // Test user service
        const userFromService = await usersPrisma.findByUsername('user.test');

        expect(userFromService).toHaveProperty('username', userTest.username);
        expect(userFromService).toHaveProperty('fullName', userTest.fullName);
        expect(userFromService).toHaveProperty('email', userTest.email);
        expect(userFromService).toHaveProperty('isAdmin', false);
        expect(userFromService?.createdAt).not.toBeNull();
        expect(userFromService?.updatedAt).not.toBeNull();
        expect(userFromService?.metadata).toHaveProperty('acceptedTerms', true);
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
