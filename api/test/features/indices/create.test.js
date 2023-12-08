const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const indicesPrisma = require('../../../lib/services/elastic/indices');
const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const usersService = require('../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[indices]: Test create features', () => {
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
    it(`#01 Should create new index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/indices/${indexName}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);

      const httpElasticResponse = await indicesPrisma.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 200);
    });

    afterAll(async () => {
      await indicesPrisma.removeAll();
    });
  });
  describe('As user', () => {
    let userToken;

    beforeAll(async () => {
      // TODO use service
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await usersService.generateToken(userTest.username, userTest.password);
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

      const httpElasticResponse = await indicesPrisma.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 404);
    });

    afterAll(async () => {
      await indicesPrisma.removeAll();
      await usersPrisma.removeAll();
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

      const httpElasticResponse = await indicesPrisma.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 404);
    });

    afterAll(async () => {
      await indicesPrisma.removeAll();
    });
  });
  describe('Without token', () => {
    it(`#04 Should not create index [${indexName}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/indices/${indexName}`,
      });
      expect(httpAppResponse).toHaveProperty('status', 401);

      const httpElasticResponse = await indicesPrisma.get(indexName, null, { ignore: [404] });
      expect(httpElasticResponse).toHaveProperty('statusCode', 404);
    });

    afterAll(async () => {
      await indicesPrisma.removeAll();
    });
  });
});
