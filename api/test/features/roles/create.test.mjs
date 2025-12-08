import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from 'vitest';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import usersPrisma from '../../../lib/services/prisma/users';
import UsersService from '../../../lib/entities/users.service';
import rolesPrisma from '../../../lib/services/prisma/roles';

const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;

describe('[roles] Create features', () => {
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
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await (new UsersService()).generateToken(adminUser.username);
    });

    it('#01 Should be able to create a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/roles/${testRole.id}`,
        data: testRole,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 201);

      const roleFromResponse = httpAppResponse?.data;

      expect(roleFromResponse).toMatchObject({
        ...testRole,
        createdAt: expect.stringMatching(isoDatePattern),
        updatedAt: expect.stringMatching(isoDatePattern),
      });

      // Check DB state
      const roleFromService = await rolesPrisma.findByID(roleFromResponse.id);
      const jsonifiedRoleFromService = JSON.parse(JSON.stringify(roleFromService));
      expect(jsonifiedRoleFromService).toEqual(roleFromResponse);
    });
  });

  describe('An authenticated user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: testUser });
      userToken = await (new UsersService()).generateToken(testUser.username);
    });

    it('#02 Should not be able to create a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/roles/${testRole.id}`,
        data: testRole,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 403);

      // Check DB state
      const nbRoles = await rolesPrisma.count();
      expect(nbRoles).toEqual(0);
    });
  });

  describe('An unauthenticated user', () => {
    it('#03 Should not be able to create a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/roles/${testRole.id}`,
        data: testRole,
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Check DB state
      const nbRoles = await rolesPrisma.count();
      expect(nbRoles).toEqual(0);
    });
  });
});
