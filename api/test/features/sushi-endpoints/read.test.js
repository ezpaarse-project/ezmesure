const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');
const sushiEndpointsService = require('../../../lib/entities/sushi-endpoint.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[sushi-endpoint]: Test read sushi-endpoints features', () => {
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

  let sushiEndpointId;

  let adminToken;
  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    beforeEach(async () => {
      const sushiEndpoint = await sushiEndpointsService.create({ data: sushiEndpointTest });
      sushiEndpointId = sushiEndpoint.id;
    });
    describe('Get all sushi-endpoints', () => {
      it('#01 Should get all sushi-endpoints', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/sushi-endpoints',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);
        const [sushiEndpoint] = httpAppResponse.data;

        expect(sushiEndpoint?.createdAt).not.toBeNull();
        expect(sushiEndpoint?.updatedAt).not.toBeNull();
        expect(sushiEndpoint).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpoint).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpoint).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpoint).toHaveProperty('counterVersion', sushiEndpointTest.counterVersion);
        expect(sushiEndpoint).toHaveProperty('technicalProvider', sushiEndpointTest.technicalProvider);
        expect(sushiEndpoint).toHaveProperty('requireCustomerId', sushiEndpointTest.requireCustomerId);
        expect(sushiEndpoint).toHaveProperty('requireRequestorId', sushiEndpointTest.requireRequestorId);
        expect(sushiEndpoint).toHaveProperty('requireApiKey', sushiEndpointTest.requireApiKey);
        expect(sushiEndpoint).toHaveProperty('ignoreReportValidation', sushiEndpointTest.ignoreReportValidation);
        expect(sushiEndpoint).toHaveProperty('defaultCustomerId', sushiEndpointTest.defaultCustomerId);
        expect(sushiEndpoint).toHaveProperty('defaultRequestorId', sushiEndpointTest.defaultRequestorId);
        expect(sushiEndpoint).toHaveProperty('defaultApiKey', sushiEndpointTest.defaultApiKey);
        expect(sushiEndpoint).toHaveProperty('paramSeparator', sushiEndpointTest.paramSeparator);
      });
    });
    describe('Get sushi-endpoint', () => {
      it('#02 Should not get sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/sushi-endpoints/not-exist',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 404);
      });
    });
    afterEach(async () => {
      await sushiEndpointsService.deleteAll();
    });
  });
  describe('As user', () => {
    let userTest;
    let userToken;

    beforeAll(async () => {
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });

    beforeEach(async () => {
      const sushiEndpoint = await sushiEndpointsService.create({ data: sushiEndpointTest });
      sushiEndpointId = sushiEndpoint.id;
    });

    describe('Get sushi-endpoints', () => {
      it('#03 Should get sushi-endpoints', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/sushi-endpoints',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);
        const [sushiEndpoint] = httpAppResponse.data;

        expect(sushiEndpoint?.createdAt).not.toBeNull();
        expect(sushiEndpoint?.updatedAt).not.toBeNull();
        expect(sushiEndpoint).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpoint).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpoint).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpoint).toHaveProperty('counterVersion', sushiEndpointTest.counterVersion);
        expect(sushiEndpoint).toHaveProperty('technicalProvider', sushiEndpointTest.technicalProvider);
        expect(sushiEndpoint).toHaveProperty('requireCustomerId', sushiEndpointTest.requireCustomerId);
        expect(sushiEndpoint).toHaveProperty('requireRequestorId', sushiEndpointTest.requireRequestorId);
        expect(sushiEndpoint).toHaveProperty('requireApiKey', sushiEndpointTest.requireApiKey);
        expect(sushiEndpoint).toHaveProperty('ignoreReportValidation', sushiEndpointTest.ignoreReportValidation);
        expect(sushiEndpoint).toHaveProperty('defaultCustomerId', sushiEndpointTest.defaultCustomerId);
        expect(sushiEndpoint).toHaveProperty('defaultRequestorId', sushiEndpointTest.defaultRequestorId);
        expect(sushiEndpoint).toHaveProperty('defaultApiKey', sushiEndpointTest.defaultApiKey);
        expect(sushiEndpoint).toHaveProperty('paramSeparator', sushiEndpointTest.paramSeparator);
      });
    });

    describe('Get sushi-endpoint', () => {
      it('#04 Should get sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);
        const sushiEndpoint = httpAppResponse?.data;

        expect(sushiEndpoint?.createdAt).not.toBeNull();
        expect(sushiEndpoint?.updatedAt).not.toBeNull();
        expect(sushiEndpoint).toHaveProperty('sushiUrl', sushiEndpointTest.sushiUrl);
        expect(sushiEndpoint).toHaveProperty('vendor', sushiEndpointTest.vendor);
        expect(sushiEndpoint).toHaveProperty('description', sushiEndpointTest.description);
        expect(sushiEndpoint).toHaveProperty('counterVersion', sushiEndpointTest.counterVersion);
        expect(sushiEndpoint).toHaveProperty('technicalProvider', sushiEndpointTest.technicalProvider);
        expect(sushiEndpoint).toHaveProperty('requireCustomerId', sushiEndpointTest.requireCustomerId);
        expect(sushiEndpoint).toHaveProperty('requireRequestorId', sushiEndpointTest.requireRequestorId);
        expect(sushiEndpoint).toHaveProperty('requireApiKey', sushiEndpointTest.requireApiKey);
        expect(sushiEndpoint).toHaveProperty('ignoreReportValidation', sushiEndpointTest.ignoreReportValidation);
        expect(sushiEndpoint).toHaveProperty('defaultCustomerId', sushiEndpointTest.defaultCustomerId);
        expect(sushiEndpoint).toHaveProperty('defaultRequestorId', sushiEndpointTest.defaultRequestorId);
        expect(sushiEndpoint).toHaveProperty('defaultApiKey', sushiEndpointTest.defaultApiKey);
        expect(sushiEndpoint).toHaveProperty('paramSeparator', sushiEndpointTest.paramSeparator);
      });
    });

    describe('Get sushi-endpoint', () => {
      it('#05 Should not get sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/sushi-endpoints/not-exist',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 404);
      });
    });

    afterEach(async () => {
      await sushiEndpointsService.deleteAll();
    });

    afterAll(async () => {
      await usersService.deleteAll();
    });
  });
  describe('Without token', () => {
    beforeEach(async () => {
      const sushiEndpoint = await sushiEndpointsService.create({ data: sushiEndpointTest });
      sushiEndpointId = sushiEndpoint.id;
    });
    describe('Get sushi-endpoints', () => {
      it('#06 Should not get sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: '/sushi-endpoints',
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);
      });
    });
    describe('Get sushi-endpoint', () => {
      it('#07 Should not get sushi-endpoint', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          data: sushiEndpointTest,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);
      });
    });
    afterEach(async () => {
      await sushiEndpointsService.deleteAll();
    });
  });
  afterAll(async () => {
    await sushiEndpointsService.deleteAll();
  });
});
