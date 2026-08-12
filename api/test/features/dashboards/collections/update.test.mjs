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

const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;

describe('[dashboard-collections] Update features', () => {
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

  const testCollection = {
    id: 'col-1',
    name: 'Awesome collection',
    description: 'Some awesome collection with plenty of awesome dashboards',
  };

  const updatedCollection = {
    id: 'col-1',
    name: 'Perfect collection',
    description: 'The perfect collection with some of the best dashboards ever',
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
  });

  beforeEach(async () => {
    await collectionsPrisma.removeAll();
    await collectionsPrisma.create({ data: testCollection });
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await signJWT({ username: adminUser.username });
    });

    it('#01 Should be able to update a dashboard collection', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-collections/${testCollection.id}`, {
        method: 'PUT',
        body: updatedCollection,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);

      const { _data: collectionFromResponse } = httpAppResponse;

      expect(collectionFromResponse).toMatchObject({
        ...updatedCollection,
        createdAt: expect.stringMatching(isoDatePattern),
        updatedAt: expect.stringMatching(isoDatePattern),
      });

      // Check DB state
      const collectionFromService = await collectionsPrisma.findById(collectionFromResponse.id);
      const jsonifiedCollectionFromService = JSON.parse(JSON.stringify(collectionFromService));
      expect(jsonifiedCollectionFromService).toEqual(collectionFromResponse);
    });
  });

  describe('An authenticated user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: testUser });
      userToken = await signJWT({ username: testUser.username });
    });

    it('#02 Should not be able to update a dashboard collection', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-collections/${testCollection.id}`, {
        method: 'PUT',
        body: updatedCollection,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 403);

      // Check DB state
      const collectionFromService = await collectionsPrisma.findById(testCollection.id);
      expect(collectionFromService).toMatchObject(testCollection);
    });
  });

  describe('An unauthenticated user', () => {
    it('#03 Should not be able to update a dashboard collection', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-collections/${testCollection.id}`, {
        method: 'PUT',
        body: updatedCollection,
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Check DB state
      const collectionFromService = await collectionsPrisma.findById(testCollection.id);
      expect(collectionFromService).toMatchObject(testCollection);
    });
  });
});
