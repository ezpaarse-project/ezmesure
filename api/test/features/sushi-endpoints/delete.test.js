const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');
const sushiEndpointsService = require('../../../lib/entities/sushi-endpoint.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[sushi-endpoint]: Test update sushi-endpoints features', () => {
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
    describe('Delete sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsService.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });

      it(`#01 DELETE /sushi-endpoints/${sushiEndpointId} - Should delete sushi-endpoint`, async () => {
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
        const sushiEndpointsFromService = await sushiEndpointsService.findMany();
        expect(sushiEndpointsFromService).toEqual([]);
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

    describe('Delete sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsService.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });

      it(`#02 DELETE /sushi-endpoints/${sushiEndpointId} - Should not delete sushi-endpoint`, async () => {
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

    afterAll(async () => {
      await usersService.deleteAll();
    });
  });

  describe('Without random token', () => {
    describe('Delete sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsService.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });
      it(`#03 DELETE /sushi-endpoints/${sushiEndpointId} - Should not delete sushi-endpoint`, async () => {
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
  describe('Without token', () => {
    describe('Delete sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        const sushiEndpoint = await sushiEndpointsService.create({ data: sushiEndpointTest });
        sushiEndpointId = sushiEndpoint.id;
      });
      it(`#04 DELETE /sushi-endpoints/${sushiEndpointId} - Should not delete sushi-endpoint`, async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          data: sushiEndpointTest,
        });

        // Test API
        expect(res).toHaveProperty('status', 401);

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
});
