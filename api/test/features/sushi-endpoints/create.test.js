const ezmesure = require('../../setup/ezmesure');

const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { deleteSushiEndpointAsAdmin } = require('../../setup/sushi-endpoint');

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
    describe('POST /sushi-enpoints - Create new sushi-endpoint', () => {
      let sushiEndpointId;
      it('Should create sushi-endpoint', async () => {
        const res = await ezmesure({
          method: 'POST',
          url: '/sushi-endpoints',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: sushiEndpointTest,
        });

        expect(res).toHaveProperty('status', 201);
        const sushiEndpoint = res?.data;
        sushiEndpointId = sushiEndpoint.id;

        expect(sushiEndpoint?.id).not.toBeNull();
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

      it('Should get sushi-endpoint', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        expect(res).toHaveProperty('status', 200);
        const sushiEndpoint = res?.data;

        expect(sushiEndpoint?.id).not.toBeNull();
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

      afterAll(async () => {
        await deleteSushiEndpointAsAdmin(sushiEndpointId);
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

    describe('POST /sushi-enpoints - Create new sushi-endpoint', () => {
      let sushiEndpointId;
      it('Should get HTTP status 403', async () => {
        const res = await ezmesure({
          method: 'POST',
          url: '/sushi-endpoints',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: sushiEndpointTest,
        });

        expect(res).toHaveProperty('status', 403);
      });

      it('Should get HTTP status 404', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        expect(res).toHaveProperty('status', 404);
      });
    });

    afterAll(async () => {
      await deleteUserAsAdmin(userTest.username);
    });
  });
  describe('Without token', () => {
    describe('POST /sushi-enpoints - Create new sushi-endpoint', () => {
      let sushiEndpointId;
      it('Should get HTTP status 401', async () => {
        const res = await ezmesure({
          method: 'POST',
          url: '/sushi-endpoints',
          data: sushiEndpointTest,
        });

        expect(res).toHaveProperty('status', 401);
      });

      it('Should get HTTP status 404', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        expect(res).toHaveProperty('status', 404);
      });
    });
  });
});