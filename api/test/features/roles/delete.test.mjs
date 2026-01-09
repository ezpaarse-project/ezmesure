import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from 'vitest';

import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import usersPrisma from '../../../lib/services/prisma/users';
import UsersService from '../../../lib/entities/users.service';
import rolesPrisma from '../../../lib/services/prisma/roles';

const adminUsername = config.get('admin.username');

describe('[roles] Delete features', () => {
  const adminUser = {
    username: 'admin.user',
    email: 'admin@test.fr',
    fullName: 'Admin',
    isAdmin: true,
  };

  const testUser = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const testRole = {
    id: 'test-role',
    label: 'Test role',
    description: 'A role for test purposes',
    icon: '',
    color: '',
    restricted: true,
    exposed: false,
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
  });

  beforeEach(async () => {
    await rolesPrisma.removeAll();
    await rolesPrisma.create({ data: testRole });
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await (new UsersService()).generateToken(adminUsername);
    });

    it('#01 Should be able to delete a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'DELETE',
        url: `/roles/${testRole.id}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 204);

      // Check DB state
      const nbRoles = await rolesPrisma.count();
      expect(nbRoles).toEqual(0);
    });
  });

  describe('An authenticated user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: testUser });
      userToken = await (new UsersService()).generateToken(testUser.username);
    });

    it('#02 Should not be able to delete a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'DELETE',
        url: `/roles/${testRole.id}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 403);

      const nbRoles = await rolesPrisma.count();
      expect(nbRoles).toEqual(1);
    });
  });

  describe('An unauthenticated user', () => {
    it('#03 Should not be able to delete a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'DELETE',
        url: `/roles/${testRole.id}`,
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Check DB state
      const nbRoles = await rolesPrisma.count();
      expect(nbRoles).toEqual(1);
    });
  });
});
