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

describe('[roles] Read features', () => {
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

  const testRoles = [
    {
      id: 'test-role-1',
      label: 'Test role 1',
      description: 'A first role for test purposes',
      icon: '',
      color: '',
      restricted: true,
      exposed: false,
    },
    {
      id: 'test-role-2',
      label: 'Test role 2',
      description: 'A second role for test purposes',
      icon: '',
      color: '',
      restricted: false,
      exposed: true,
    },
  ];

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
  });

  beforeEach(async () => {
    await rolesPrisma.removeAll();
    await Promise.all(testRoles.map((role) => rolesPrisma.create({ data: role })));
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await (new UsersService()).generateToken(adminUser.username);
    });

    it('#01 Should be able to list roles', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: '/roles',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        data: expect.arrayContaining(testRoles.map((role) => expect.objectContaining(role))),
      });
      expect(httpAppResponse?.data).toHaveLength(2);
    });

    it('#02 Should be able to get a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/roles/${testRoles[1].id}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse?.data).toMatchObject(testRoles[1]);
    });
  });

  describe('An authenticated user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: testUser });
      userToken = await (new UsersService()).generateToken(testUser.username);
    });

    it('#03 Should be able to list roles', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: '/roles',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        data: expect.arrayContaining(testRoles.map((role) => expect.objectContaining(role))),
      });
      expect(httpAppResponse?.data).toHaveLength(2);
    });

    it('#04 Should be able to get a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/roles/${testRoles[1].id}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse?.data).toMatchObject(testRoles[1]);
    });
  });

  describe('An unauthenticated user', () => {
    it('#05 Should not be able to list roles', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: '/roles',
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    it('#06 Should not be able to get a role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/roles/${testRoles[1].id}`,
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);
    });
  });
});
