const ezmesure = require('../../setup/ezmesure');

const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { createSushiEndpointAsAdmin, deleteSushiEndpointAsAdmin } = require('../../setup/sushi-endpoint');

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
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    describe('PATCH /sushi-enpoints - Update sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        sushiEndpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
      });

      it('Should update sushi-endpoint', async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: sushiEndpointUpdateTest,
        });

        expect(res).toHaveProperty('status', 200);
        const sushiEndpoint = res?.data;
        sushiEndpointId = sushiEndpoint.id;

        expect(sushiEndpoint?.id).not.toBeNull();
        expect(sushiEndpoint?.createdAt).not.toBeNull();
        expect(sushiEndpoint?.updatedAt).not.toBeNull();
        expect(sushiEndpoint).toHaveProperty('sushiUrl', sushiEndpointUpdateTest.sushiUrl);
        expect(sushiEndpoint).toHaveProperty('vendor', sushiEndpointUpdateTest.vendor);
        expect(sushiEndpoint).toHaveProperty('description', sushiEndpointUpdateTest.description);
        expect(sushiEndpoint).toHaveProperty('counterVersion', sushiEndpointUpdateTest.counterVersion);
        expect(sushiEndpoint).toHaveProperty('technicalProvider', sushiEndpointUpdateTest.technicalProvider);
        expect(sushiEndpoint).toHaveProperty('requireCustomerId', sushiEndpointUpdateTest.requireCustomerId);
        expect(sushiEndpoint).toHaveProperty('requireRequestorId', sushiEndpointUpdateTest.requireRequestorId);
        expect(sushiEndpoint).toHaveProperty('requireApiKey', sushiEndpointUpdateTest.requireApiKey);
        expect(sushiEndpoint).toHaveProperty('ignoreReportValidation', sushiEndpointUpdateTest.ignoreReportValidation);
        expect(sushiEndpoint).toHaveProperty('defaultCustomerId', sushiEndpointUpdateTest.defaultCustomerId);
        expect(sushiEndpoint).toHaveProperty('defaultRequestorId', sushiEndpointUpdateTest.defaultRequestorId);
        expect(sushiEndpoint).toHaveProperty('defaultApiKey', sushiEndpointUpdateTest.defaultApiKey);
        expect(sushiEndpoint).toHaveProperty('paramSeparator', sushiEndpointUpdateTest.paramSeparator);
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
        expect(sushiEndpoint).toHaveProperty('sushiUrl', sushiEndpointUpdateTest.sushiUrl);
        expect(sushiEndpoint).toHaveProperty('vendor', sushiEndpointUpdateTest.vendor);
        expect(sushiEndpoint).toHaveProperty('description', sushiEndpointUpdateTest.description);
        expect(sushiEndpoint).toHaveProperty('counterVersion', sushiEndpointUpdateTest.counterVersion);
        expect(sushiEndpoint).toHaveProperty('technicalProvider', sushiEndpointUpdateTest.technicalProvider);
        expect(sushiEndpoint).toHaveProperty('requireCustomerId', sushiEndpointUpdateTest.requireCustomerId);
        expect(sushiEndpoint).toHaveProperty('requireRequestorId', sushiEndpointUpdateTest.requireRequestorId);
        expect(sushiEndpoint).toHaveProperty('requireApiKey', sushiEndpointUpdateTest.requireApiKey);
        expect(sushiEndpoint).toHaveProperty('ignoreReportValidation', sushiEndpointUpdateTest.ignoreReportValidation);
        expect(sushiEndpoint).toHaveProperty('defaultCustomerId', sushiEndpointUpdateTest.defaultCustomerId);
        expect(sushiEndpoint).toHaveProperty('defaultRequestorId', sushiEndpointUpdateTest.defaultRequestorId);
        expect(sushiEndpoint).toHaveProperty('defaultApiKey', sushiEndpointUpdateTest.defaultApiKey);
        expect(sushiEndpoint).toHaveProperty('paramSeparator', sushiEndpointUpdateTest.paramSeparator);
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

    describe('PATCH /sushi-enpoints - Update sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        sushiEndpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
      });

      it('Should get HTTP status 403', async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: sushiEndpointUpdateTest,
        });

        expect(res).toHaveProperty('status', 403);
      });

      it('Should get sushi-endpoint with no change', async () => {
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

    afterAll(async () => {
      await deleteUserAsAdmin(userTest.username);
    });
  });
  describe('Without token', () => {
    describe('PATCH /sushi-enpoints - Update sushi-endpoint', () => {
      let sushiEndpointId;
      beforeAll(async () => {
        sushiEndpointId = await createSushiEndpointAsAdmin(sushiEndpointTest);
      });
      it('Should get HTTP status 401', async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/sushi-endpoints/${sushiEndpointId}`,
          data: sushiEndpointUpdateTest,
        });

        expect(res).toHaveProperty('status', 401);
      });

      it('Should get sushi-endpoint with no change', async () => {
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
});
