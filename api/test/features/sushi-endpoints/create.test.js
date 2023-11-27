const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');
const sushiEndpointsService = require('../../../lib/entities/sushi-endpoint.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[sushi-endpoint]: Test create sushi-endpoints features', () => {
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
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    describe('POST /sushi-endpoints - Create new sushi-endpoint', () => {
      let sushiEndpointId;
      it('#01 POST /sushi-endpoints - Should create sushi-endpoint', async () => {
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

        expect(sushiEndpointFromResponse?.id).not.toBeNull();
        expect(sushiEndpointFromResponse?.createdAt).not.toBeNull();
        expect(sushiEndpointFromResponse?.updatedAt).not.toBeNull();
        expect(sushiEndpointFromResponse).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpointFromResponse).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpointFromResponse).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpointFromResponse).toHaveProperty('counterVersion', sushiEndpointTest.counterVersion);
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
        const sushiEndpointFromService = await sushiEndpointsService.findByID(sushiEndpointId);

        expect(sushiEndpointFromService?.id).not.toBeNull();
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
        await sushiEndpointsService.deleteAll();
      });
    });
  });
  describe('As user', () => {
    let userTest;
    let userToken;

    beforeAll(async () => {
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });

    describe('POST /sushi-endpoints - Create new sushi-endpoint', () => {
      it('#02 POST /sushi-endpoints - Should not create sushi-endpoint', async () => {
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
        const sushiEndpointsFromService = await sushiEndpointsService.findMany();
        expect(sushiEndpointsFromService).toEqual([]);
      });
    });

    afterAll(async () => {
      await usersService.deleteAll();
    });
  });
  describe('Without random token', () => {
    describe('POST /sushi-endpoints - Create new sushi-endpoint', () => {
      it('#03 POST /sushi-endpoints - Should not create sushi-endpoint', async () => {
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
        const sushiEndpointsFromService = await sushiEndpointsService.findMany();
        expect(sushiEndpointsFromService).toEqual([]);
      });
    });
  });
  describe('Without token', () => {
    describe('POST /sushi-endpoints - Create new sushi-endpoint', () => {
      it('#04 POST /sushi-endpoints - Should not create sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/sushi-endpoints',
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const sushiEndpointsFromService = await sushiEndpointsService.findMany();
        expect(sushiEndpointsFromService).toEqual([]);
      });
    });
  });
});
