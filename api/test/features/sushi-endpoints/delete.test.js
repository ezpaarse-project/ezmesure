const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const UsersService = require('../../../lib/entities/users.service');
const sushiEndpointsPrisma = require('../../../lib/services/prisma/sushi-endpoints');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[sushi-endpoint]: Test update sushi-endpoints features', () => {
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
    counterVersion: '5.0.0',
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
    adminToken = await UsersService.generateToken(adminUsername, adminPassword);
  });
  describe('As admin', () => {
    describe('Delete sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });

      it('#01 Should delete sushi-endpoint', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(res).toHaveProperty('status', 204);

        // Test service
        const sushiEndpointsFromService = await sushiEndpointsPrisma.findMany();
        expect(sushiEndpointsFromService).toEqual([]);
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
      userToken = await UsersService.generateToken(userTest.username, userTest.password);
    });

    describe('Delete sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });

      it('#02 Should not delete sushi-endpoint', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(res).toHaveProperty('status', 403);

        // Test sushi-endpoint service
        const sushiEndpointFromService = await sushiEndpointsPrisma.findByID(sushiEndpointId);

        expect(sushiEndpointFromService?.createdAt).not.toBeNull();
        expect(sushiEndpointFromService?.updatedAt).not.toBeNull();
        expect(sushiEndpointFromService).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpointFromService).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpointFromService).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpointFromService).toHaveProperty('counterVersion', sushiEndpointTest.counterVersion);
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

    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });

  describe('Without random token', () => {
    describe('Delete sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });
      it('#03 Should not delete sushi-endpoint', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          data: sushiEndpointTest,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(res).toHaveProperty('status', 401);

        // Test sushi-endpoint service
        const sushiEndpointFromService = await sushiEndpointsPrisma.findByID(sushiEndpointId);

        expect(sushiEndpointFromService?.createdAt).not.toBeNull();
        expect(sushiEndpointFromService?.updatedAt).not.toBeNull();
        expect(sushiEndpointFromService).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpointFromService).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpointFromService).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpointFromService).toHaveProperty('counterVersion', sushiEndpointTest.counterVersion);
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
  describe('Without token', () => {
    describe('Delete sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });
      it('#04 Should not delete sushi-endpoint', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          data: sushiEndpointTest,
        });

        // Test API
        expect(res).toHaveProperty('status', 401);

        // Test sushi-endpoint service
        const sushiEndpointFromService = await sushiEndpointsPrisma.findByID(sushiEndpointId);

        expect(sushiEndpointFromService?.createdAt).not.toBeNull();
        expect(sushiEndpointFromService?.updatedAt).not.toBeNull();
        expect(sushiEndpointFromService).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpointFromService).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpointFromService).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpointFromService).toHaveProperty('counterVersion', sushiEndpointTest.counterVersion);
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
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
