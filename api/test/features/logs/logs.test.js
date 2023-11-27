const path = require('path');
const fs = require('fs-extra');

const ezmesure = require('../../setup/ezmesure');
const indicesService = require('../../../lib/services/elastic/indices');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken } = require('../../setup/login');

const { getAdminToken } = require('../../setup/login');

describe('[logs]: Test insert features', () => {
  const indexName = 'index-text';
  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      adminToken = await getAdminToken();
      await indicesService.create(indexName, null, { ignore: [404] });
    });
    describe(`Add [wiley.csv] in [${indexName}] index`, () => {
      // FIXME, test break after 2 times
      it(`#01 POST /logs/:name - Should upload ec in index [${indexName}]`, async () => {
        const pathFile = path.resolve(__dirname, '..', '..', 'sources', 'wiley.csv');

        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: `/logs/${indexName}`,
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        expect(httpAppResponse).toHaveProperty('status', 200);

        const { data } = httpAppResponse;

        expect(data).toHaveProperty('total', 6);
        expect(data).toHaveProperty('inserted', 5);
        expect(data).toHaveProperty('updated', 1);
        expect(data).toHaveProperty('failed', 0);
        expect(data).toHaveProperty('errors', []);
        expect(data).toHaveProperty('took');
        expect(data?.took).toBeGreaterThan(0);
      });

      afterAll(async () => {
        await indicesService.deleteAll();
      });
    });
  });
  describe('As user', () => {
    let userTest;
    let userToken;

    beforeEach(async () => {
      // TODO use service to create user
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });
    // TODO create roles
    describe(`Add [wiley.csv] in [${indexName}] index who has roles`, () => {
      beforeAll(async () => {
        await indicesService.create(indexName, null, { ignore: [404] });
      });

      it(`#02 POST /logs/:name - Should not upload ec in index [${indexName}]`, async () => {
        const pathFile = path.resolve(__dirname, '..', '..', 'sources', 'wiley.csv');

        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: `/logs/${indexName}`,
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        expect(httpAppResponse).toHaveProperty('status', 403);
      });

      afterAll(async () => {
        await indicesService.deleteAll();
      });
    });

    describe(`Add [wiley.csv] in [${indexName}] index who has roles`, () => {
      beforeAll(async () => {
        await indicesService.create(indexName, null, { ignore: [404] });
      });

      it(`#03 POST /logs/:name - Should not upload ec in index [${indexName}]`, async () => {
        const pathFile = path.resolve(__dirname, '..', '..', 'sources', 'wiley.csv');

        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: `/logs/${indexName}`,
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        expect(httpAppResponse).toHaveProperty('status', 403);
      });

      afterAll(async () => {
        await indicesService.deleteAll();
      });
    });
    afterEach(async () => {
      await usersService.deleteAll();
    });
  });
  describe('With random token', () => {
    beforeAll(async () => {
      await indicesService.create(indexName, null, { ignore: [404] });
    });

    it(`#04 POST /logs/:name - Should not upload ec in index [${indexName}]`, async () => {
      const pathFile = path.resolve(__dirname, '..', '..', 'sources', 'wiley.csv');

      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: `/logs/${indexName}`,
        data: await fs.readFile(pathFile, 'utf-8'),
        headers: {
          Authorization: 'Bearer: random',
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await indicesService.deleteAll();
    });
  });
  describe('Without token', () => {
    beforeAll(async () => {
      await indicesService.create(indexName, null, { ignore: [404] });
    });

    it(`#05 POST /logs/:name - Should not upload ec in index [${indexName}]`, async () => {
      const pathFile = path.resolve(__dirname, '..', '..', 'sources', 'wiley.csv');

      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: `/logs/${indexName}`,
        data: await fs.readFile(pathFile, 'utf-8'),
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await indicesService.deleteAll();
    });
  });
});
