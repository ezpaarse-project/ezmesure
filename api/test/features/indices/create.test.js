const ezmesure = require('../../setup/ezmesure');
const indicesService = require('../../../lib/services/elastic/indices');
const usersService = require('../../../lib/entities/users.service');

const { getAdminToken, getToken } = require('../../setup/login');
const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');

describe('[indices]: Test create features', () => {
  const indexName = 'test';

  let adminToken;
  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    it(`#01 Should create new index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/indices/${indexName}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);

      const httpElasticResponse = await indicesService.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 200);
    });

    afterAll(async () => {
      await indicesService.deleteAll();
    });
  });
  describe('As user', () => {
    let userTest;
    let userToken;

    beforeAll(async () => {
      // TODO use service
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });

    it(`#02 Should not create index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/indices/${indexName}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      expect(httpAppResponse).toHaveProperty('status', 403);

      const httpElasticResponse = await indicesService.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 404);
    });

    afterAll(async () => {
      await indicesService.deleteAll();
      await usersService.deleteAll();
    });
  });
  describe('With random token', () => {
    it(`#03 Should not create index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/indices/${indexName}`,
        headers: {
          Authorization: 'Bearer: random',
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 401);

      const httpElasticResponse = await indicesService.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 404);
    });

    afterAll(async () => {
      await indicesService.deleteAll();
    });
  });
  describe('Without token', () => {
    it(`#04 Should not create index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/indices/${indexName}`,
      });
      expect(httpAppResponse).toHaveProperty('status', 401);

      const httpElasticResponse = await indicesService.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 404);
    });

    afterAll(async () => {
      await indicesService.deleteAll();
    });
  });
});
