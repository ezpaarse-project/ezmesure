import {
  describe, it, expect, beforeAll, afterAll,
} from 'vitest';
import { parseSetCookie, stringifyCookie } from 'cookie';
import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';
import { signJWT } from '../../../lib/utils/jwt';

import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';

const adminUsername = config.get('admin.username');
const authCookie = config.get('auth.cookie');

// The user to be impersonated
const targetUser = {
  username: 'target.user',
  email: 'target.user@test.fr',
  fullName: 'Target User',
  isAdmin: false,
  acceptedTerms: true,
  metadata: {},
};

// A regular user with no admin privileges
const regularUser = {
  username: 'regular.user',
  email: 'regular.user@test.fr',
  fullName: 'Test User',
  isAdmin: false,
  acceptedTerms: true,
  metadata: {},
};

let adminToken;
let regularUserToken;

describe('[users]: Test impersonation features', () => {
  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();

    await usersPrisma.create({ data: targetUser });
    await usersElastic.createUser(targetUser);

    await usersPrisma.create({ data: regularUser });
    await usersElastic.createUser(regularUser);

    adminToken = await signJWT({ username: adminUsername });
    regularUserToken = await signJWT({ username: regularUser.username });
  });

  describe('An admin', () => {
    it('#01 Should be able to impersonate another user', async () => {
      const httpAppResponse = await ezmesure.raw(`/users/${targetUser.username}/_impersonate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);

      const cookies = httpAppResponse.headers.getSetCookie().map(parseSetCookie);
      const jwePattern = /^[a-z0-9_-]+(\.[a-z0-9_-]*){4}$/i;

      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: authCookie,
            value: expect.stringMatching(jwePattern),
          }),
        ]),
      );

      const userTokenCookie = cookies.find((cookie) => cookie.name === authCookie);

      const profileResponse = await ezmesure.raw('/auth', {
        method: 'GET',
        headers: {
          Cookie: stringifyCookie({ [userTokenCookie.name]: userTokenCookie.value }),
        },
      });

      expect(profileResponse).toHaveProperty('status', 200);
      expect(profileResponse).toHaveProperty('_data.username', targetUser.username);
    });
  });

  describe('A regular user', () => {
    it('#02 Should not be able to impersonate another user', async () => {
      const httpAppResponse = await ezmesure.raw(`/users/${targetUser.username}/_impersonate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${regularUserToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 403);
    });
  });

  describe('An anonymous user', () => {
    it('#03 Should not be able to impersonate another user', async () => {
      const httpAppResponse = await ezmesure.raw(`/users/${targetUser.username}/_impersonate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${regularUser}`,
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
