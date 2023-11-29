const ezmesure = require('../../setup/ezmesure');
const indicesService = require('../../../lib/services/elastic/indices');
const usersService = require('../../../lib/entities/users.service');

const { getAdminToken, getToken } = require('../../setup/login');
const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');

describe('[indices]: Test delete features', () => {
  const indexName = 'test';

  let adminToken;
  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    beforeEach(async () => {
      await indicesService.create(indexName, null, { ignore: [404] });
    });
    it(`#01 Should delete index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'DELETE',
        url: `/indices/${indexName}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 204);

      const httpElasticResponse = await indicesService.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 404);
    });

    afterEach(async () => {
      await indicesService.deleteAll();
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
      await indicesService.create(indexName, null, { ignore: [404] });
    });
    it(`#02 Should not delete index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'DELETE',
        url: `/indices/${indexName}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      expect(httpAppResponse).toHaveProperty('status', 403);

      const httpElasticResponse = await indicesService.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 200);
    });

    afterEach(async () => {
      await indicesService.deleteAll();
    });

    afterAll(async () => {
      await usersService.deleteAll();
    });
  });
  describe('With random token', () => {
    beforeEach(async () => {
      await indicesService.create(indexName, null, { ignore: [404] });
    });
    it(`#03 Should not delete index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'DELETE',
        url: `/indices/${indexName}`,
        headers: {
          Authorization: 'Bearer: random',
        },
      });
      expect(httpAppResponse).toHaveProperty('status', 401);

      const httpElasticResponse = await indicesService.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 200);
    });

    afterEach(async () => {
      await indicesService.deleteAll();
    });
  });
  describe('Without token', () => {
    beforeEach(async () => {
      await indicesService.create(indexName, null, { ignore: [404] });
    });
    it(`#04 Should not delete index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'DELETE',
        url: `/indices/${indexName}`,
        headers: {
          Authorization: 'Bearer: random',
        },
      });
      expect(httpAppResponse).toHaveProperty('status', 401);

      const httpElasticResponse = await indicesService.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 200);
    });

    afterEach(async () => {
      await indicesService.deleteAll();
    });
  });
});
