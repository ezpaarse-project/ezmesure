import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';
import UsersService from '../../../lib/entities/users.service';
import sushiEndpointsPrisma from '../../../lib/services/prisma/sushi-endpoints';

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[sushi-endpoint]: Test create sushi-endpoints features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const sushiEndpointTest = {
    sushiUrl: 'http://localhost',
    vendor: 'test vendor',
    description: 'test description',
    counterVersions: ['5.0.0'],
    technicalProvider: 'test technicalProvider',
    requireCustomerId: true,
    requireRequestorId: true,
    requireApiKey: true,
    ignoreReportValidation: true,
    defaultCustomerId: 'test defaultCustomerId',
    defaultRequestorId: 'test defaultRequestorId',
    defaultApiKey: 'defaultApiKey',
    paramSeparator: ',',
    tags: [],
  };

  let adminToken;
  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await (new UsersService()).generateToken(adminUsername, adminPassword);
  });
  describe('As admin', () => {
    describe('Create new sushi-endpoint', () => {
      let sushiEndpointId;
      it('#01 Should create sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/sushi-endpoints',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 201);
        const sushiEndpointFromResponse = httpAppResponse?.data;
        sushiEndpointId = sushiEndpointFromResponse.id;

        expect(sushiEndpointFromResponse?.createdAt).not.toBeNull();
        expect(sushiEndpointFromResponse?.updatedAt).not.toBeNull();
        expect(sushiEndpointFromResponse).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpointFromResponse).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpointFromResponse).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpointFromResponse).toHaveProperty('counterVersions', sushiEndpointTest.counterVersions);
        expect(sushiEndpointFromResponse).toHaveProperty('technicalProvider', sushiEndpointTest.technicalProvider);
        expect(sushiEndpointFromResponse).toHaveProperty('requireCustomerId', sushiEndpointTest.requireCustomerId);
        expect(sushiEndpointFromResponse).toHaveProperty('requireRequestorId', sushiEndpointTest.requireRequestorId);
        expect(sushiEndpointFromResponse).toHaveProperty('requireApiKey', sushiEndpointTest.requireApiKey);
        expect(sushiEndpointFromResponse).toHaveProperty('ignoreReportValidation', sushiEndpointTest.ignoreReportValidation);
        expect(sushiEndpointFromResponse).toHaveProperty('defaultCustomerId', sushiEndpointTest.defaultCustomerId);
        expect(sushiEndpointFromResponse).toHaveProperty('defaultRequestorId', sushiEndpointTest.defaultRequestorId);
        expect(sushiEndpointFromResponse).toHaveProperty('defaultApiKey', sushiEndpointTest.defaultApiKey);
        expect(sushiEndpointFromResponse).toHaveProperty('paramSeparator', sushiEndpointTest.paramSeparator);

        // Test sushi-endpoint service
        const sushiEndpointFromService = await sushiEndpointsPrisma.findByID(sushiEndpointId);

        expect(sushiEndpointFromService?.createdAt).not.toBeNull();
        expect(sushiEndpointFromService?.updatedAt).not.toBeNull();
        expect(sushiEndpointFromService).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpointFromService).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpointFromService).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpointFromService).toHaveProperty('counterVersions', sushiEndpointTest.counterVersions);
        expect(sushiEndpointFromService).toHaveProperty('technicalProvider', sushiEndpointTest.technicalProvider);
        expect(sushiEndpointFromService).toHaveProperty('requireCustomerId', sushiEndpointTest.requireCustomerId);
        expect(sushiEndpointFromService).toHaveProperty('requireRequestorId', sushiEndpointTest.requireRequestorId);
        expect(sushiEndpointFromService).toHaveProperty('requireApiKey', sushiEndpointTest.requireApiKey);
        expect(sushiEndpointFromService).toHaveProperty('ignoreReportValidation', sushiEndpointTest.ignoreReportValidation);
        expect(sushiEndpointFromService).toHaveProperty('defaultCustomerId', sushiEndpointTest.defaultCustomerId);
        expect(sushiEndpointFromService).toHaveProperty('defaultRequestorId', sushiEndpointTest.defaultRequestorId);
        expect(sushiEndpointFromService).toHaveProperty('defaultApiKey', sushiEndpointTest.defaultApiKey);
        expect(sushiEndpointFromService).toHaveProperty('paramSeparator', sushiEndpointTest.paramSeparator);
      });

      afterAll(async () => {
        await sushiEndpointsPrisma.removeAll();
      });
    });
  });
  describe('As user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await (new UsersService()).generateToken(userTest.username, userTest.password);
    });

    describe('Create new sushi-endpoint', () => {
      it('#02 Should not create sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/sushi-endpoints',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Test service
        const sushiEndpointsFromService = await sushiEndpointsPrisma.findMany();
        expect(sushiEndpointsFromService).toEqual([]);
      });
    });

    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });
  describe('Without random token', () => {
    describe('Create new sushi-endpoint', () => {
      it('#03 Should not create sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/sushi-endpoints',
          data: sushiEndpointTest,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const sushiEndpointsFromService = await sushiEndpointsPrisma.findMany();
        expect(sushiEndpointsFromService).toEqual([]);
      });
    });
  });
  describe('Without token', () => {
    describe('Create new sushi-endpoint', () => {
      it('#04 Should not create sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/sushi-endpoints',
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const sushiEndpointsFromService = await sushiEndpointsPrisma.findMany();
        expect(sushiEndpointsFromService).toEqual([]);
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
