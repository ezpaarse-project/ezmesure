import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from 'vitest';

import ezmesure from '../../../setup/ezmesure';

import { resetDatabase } from '../../../../lib/services/prisma/utils';
import { resetElastic } from '../../../../lib/services/elastic/utils';
import { signJWT } from '../../../../lib/utils/jwt';

import usersPrisma from '../../../../lib/services/prisma/users';
import collectionsPrisma from '../../../../lib/services/prisma/dashboard-collections';

describe('[dashboard-collections] Read features', () => {
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

  const testCollections = [
    {
      id: 'col-1',
      name: 'First collection',
      description: 'The very first collection',
    },
    {
      id: 'col-2',
      name: 'Second collection',
      description: 'The second and last collection',
    },
  ];

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
  });

  beforeEach(async () => {
    await collectionsPrisma.removeAll();
    await Promise.all(
      testCollections.map((collection) => collectionsPrisma.create({ data: collection })),
    );
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await signJWT({ username: adminUser.username });
    });

    it('#01 Should be able to list dashboard collections', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-collections', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        _data: expect.arrayContaining(
          testCollections.map((dashboard) => expect.objectContaining(dashboard)),
        ),
      });

      const { _data: collectionFromResponse } = httpAppResponse;

      expect(collectionFromResponse).toHaveLength(2);
    });

    it('#02 Should be able to get a dashboard collection', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-collections/${testCollections[1].id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      const { _data: collectionFromResponse } = httpAppResponse;
      expect(collectionFromResponse).toMatchObject(testCollections[1]);
    });
  });

  describe('An authenticated user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: testUser });
      userToken = await signJWT({ username: testUser.username });
    });

    it('#03 Should be able to list dashboard collections', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-collections', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        _data: expect.arrayContaining(testCollections.map((role) => expect.objectContaining(role))),
      });
      const { _data: dashboardFromResponse } = httpAppResponse;
      expect(dashboardFromResponse).toHaveLength(2);
    });

    it('#04 Should be able to get a dashboard collection', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-collections/${testCollections[1].id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      const { _data: dashboardFromResponse } = httpAppResponse;
      expect(dashboardFromResponse).toMatchObject(testCollections[1]);
    });
  });

  describe('An unauthenticated user', () => {
    it('#05 Should not be able to list dashboard collections', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-collections', {
        method: 'GET',
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    it('#06 Should not be able to get a dashboard collection', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-collections/${testCollections[1].id}`, {
        method: 'GET',
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);
    });
  });
});
