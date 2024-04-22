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

describe('[sushi-endpoint]: Test delete sushi-endpoints features', () => {
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

  const sushiEndpointUpdateTest = {
    sushiUrl: 'http://localhost.updated',
    vendor: 'test vendor updated',
    description: 'test description updated',
    counterVersion: '5.0.1',
    technicalProvider: 'test technicalProvider updated',
    requireCustomerId: true,
    requireRequestorId: true,
    requireApiKey: true,
    ignoreReportValidation: true,
    defaultCustomerId: 'test defaultCustomerId updated',
    defaultRequestorId: 'test defaultRequestorId updated',
    defaultApiKey: 'defaultApiKey updated',
    paramSeparator: ';',
    tags: [],
  };

  let adminToken;
  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await (new UsersService()).generateToken(adminUsername, adminPassword);
  });
  describe('As admin', () => {
    describe('Update sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });

      it('#01 Should update sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PATCH',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: sushiEndpointUpdateTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);
        const sushiEndpointFromResponse = httpAppResponse?.data;
        sushiEndpointId = sushiEndpointFromResponse.id;

        expect(sushiEndpointFromResponse?.createdAt).not.toBeNull();
        expect(sushiEndpointFromResponse?.updatedAt).not.toBeNull();
        expect(sushiEndpointFromResponse).toHaveProperty('sushiUrl', sushiEndpointUpdateTest.sushiUrl);
        expect(sushiEndpointFromResponse).toHaveProperty('vendor', sushiEndpointUpdateTest.vendor);
        expect(sushiEndpointFromResponse).toHaveProperty('description', sushiEndpointUpdateTest.description);
        expect(sushiEndpointFromResponse).toHaveProperty('counterVersion', sushiEndpointUpdateTest.counterVersion);
        expect(sushiEndpointFromResponse).toHaveProperty('technicalProvider', sushiEndpointUpdateTest.technicalProvider);
        expect(sushiEndpointFromResponse).toHaveProperty('requireCustomerId', sushiEndpointUpdateTest.requireCustomerId);
        expect(sushiEndpointFromResponse).toHaveProperty('requireRequestorId', sushiEndpointUpdateTest.requireRequestorId);
        expect(sushiEndpointFromResponse).toHaveProperty('requireApiKey', sushiEndpointUpdateTest.requireApiKey);
        expect(sushiEndpointFromResponse).toHaveProperty('ignoreReportValidation', sushiEndpointUpdateTest.ignoreReportValidation);
        expect(sushiEndpointFromResponse).toHaveProperty('defaultCustomerId', sushiEndpointUpdateTest.defaultCustomerId);
        expect(sushiEndpointFromResponse).toHaveProperty('defaultRequestorId', sushiEndpointUpdateTest.defaultRequestorId);
        expect(sushiEndpointFromResponse).toHaveProperty('defaultApiKey', sushiEndpointUpdateTest.defaultApiKey);
        expect(sushiEndpointFromResponse).toHaveProperty('paramSeparator', sushiEndpointUpdateTest.paramSeparator);

        // Test sushi-endpoint service
        const sushiEndpointFromService = await sushiEndpointsPrisma.findByID(sushiEndpointId);

        expect(sushiEndpointFromService?.createdAt).not.toBeNull();
        expect(sushiEndpointFromService?.updatedAt).not.toBeNull();
        expect(sushiEndpointFromService).toHaveProperty('sushiUrl', sushiEndpointUpdateTest.sushiUrl);
        expect(sushiEndpointFromService).toHaveProperty('vendor', sushiEndpointUpdateTest.vendor);
        expect(sushiEndpointFromService).toHaveProperty('description', sushiEndpointUpdateTest.description);
        expect(sushiEndpointFromService).toHaveProperty('counterVersion', sushiEndpointUpdateTest.counterVersion);
        expect(sushiEndpointFromService).toHaveProperty('technicalProvider', sushiEndpointUpdateTest.technicalProvider);
        expect(sushiEndpointFromService).toHaveProperty('requireCustomerId', sushiEndpointUpdateTest.requireCustomerId);
        expect(sushiEndpointFromService).toHaveProperty('requireRequestorId', sushiEndpointUpdateTest.requireRequestorId);
        expect(sushiEndpointFromService).toHaveProperty('requireApiKey', sushiEndpointUpdateTest.requireApiKey);
        expect(sushiEndpointFromService).toHaveProperty('ignoreReportValidation', sushiEndpointUpdateTest.ignoreReportValidation);
        expect(sushiEndpointFromService).toHaveProperty('defaultCustomerId', sushiEndpointUpdateTest.defaultCustomerId);
        expect(sushiEndpointFromService).toHaveProperty('defaultRequestorId', sushiEndpointUpdateTest.defaultRequestorId);
        expect(sushiEndpointFromService).toHaveProperty('defaultApiKey', sushiEndpointUpdateTest.defaultApiKey);
        expect(sushiEndpointFromService).toHaveProperty('paramSeparator', sushiEndpointUpdateTest.paramSeparator);
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

    describe('Update sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });

      it('#02 Should not update sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PATCH',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: sushiEndpointUpdateTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

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
    describe('Update sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });
      it('#03 Should not update sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PATCH',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          data: sushiEndpointUpdateTest,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

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
    describe('Update sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });
      it('#04 Should not update sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PATCH',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          data: sushiEndpointUpdateTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

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
