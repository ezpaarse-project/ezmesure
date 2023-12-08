const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const indicesPrisma = require('../../../lib/services/elastic/indices');
const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');

const usersService = require('../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[indices]: Test delete features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const indexName = 'test';

  let adminToken;
  beforeAll(async () => {
    adminToken = await usersService.generateToken(adminUsername, adminPassword);
  });
  describe('As admin', () => {
    beforeEach(async () => {
      await indicesPrisma.create(indexName, null, { ignore: [404] });
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

      const httpElasticResponse = await indicesPrisma.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 404);
    });

    afterEach(async () => {
      await indicesPrisma.removeAll();
    });
  });
  describe('As user', () => {
    let userToken;
    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await usersService.generateToken(userTest.username, userTest.password);
    });
    beforeEach(async () => {
      await indicesPrisma.create(indexName, null, { ignore: [404] });
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

      const httpElasticResponse = await indicesPrisma.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 200);
    });

    afterEach(async () => {
      await indicesPrisma.removeAll();
    });

    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });
  describe('With random token', () => {
    beforeEach(async () => {
      await indicesPrisma.create(indexName, null, { ignore: [404] });
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

      const httpElasticResponse = await indicesPrisma.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 200);
    });

    afterEach(async () => {
      await indicesPrisma.removeAll();
    });
  });
  describe('Without token', () => {
    beforeEach(async () => {
      await indicesPrisma.create(indexName, null, { ignore: [404] });
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

      const httpElasticResponse = await indicesPrisma.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 200);
    });

    afterEach(async () => {
      await indicesPrisma.removeAll();
    });
  });
});
