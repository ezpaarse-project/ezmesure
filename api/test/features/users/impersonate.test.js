const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const usersService = require('../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const authCookie = config.get('auth.cookie');

// The user to be impersonated
const targetUser = {
  username: 'target.user',
  email: 'target.user@test.fr',
  fullName: 'Target User',
  isAdmin: false,
  metadata: { acceptedTerms: true },
};

// A regular user with no admin privileges
const regularUser = {
  username: 'regular.user',
  email: 'regular.user@test.fr',
  fullName: 'Test User',
  isAdmin: false,
  metadata: { acceptedTerms: true },
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

    adminToken = await usersService.generateToken(adminUsername);
    regularUserToken = await usersService.generateToken(regularUser.username);
  });

  describe('An admin', () => {
    it('#01 Should be able to impersonate another user', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/users/target.user/_impersonate',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const tokenPattern = new RegExp(`^${authCookie}=([a-z0-9._-]+)`, 'i');

      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toHaveProperty('headers.set-cookie[0]', expect.stringMatching(tokenPattern));

      const cookieHeader = httpAppResponse.headers['set-cookie'];
      const targetUserToken = tokenPattern.exec(cookieHeader)?.[1];

      const profileResponse = await ezmesure({
        method: 'GET',
        url: '/profile',
        headers: {
          Authorization: `Bearer ${targetUserToken}`,
        },
      });

      expect(profileResponse).toHaveProperty('status', 200);
      expect(profileResponse).toHaveProperty('data.username', targetUser.username);
    });
  });

  describe('A regular user', () => {
    it('#02 Should not be able to impersonate another user', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/users/target.user/_impersonate',
        headers: {
          Authorization: `Bearer ${regularUserToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 403);
    });
  });

  describe('An anonymous user', () => {
    it('#03 Should not be able to impersonate another user', async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/users/target.user/_impersonate',
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
