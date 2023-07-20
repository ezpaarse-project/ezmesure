const path = require('path');
const fs = require('fs-extra');

const ezmesure = require('../../setup/ezmesure');
const { createIndexAsAdmin, deleteIndexAsAdmin } = require('../../setup/indices');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken } = require('../../setup/login');

const { getAdminToken } = require('../../setup/login');

describe('[logs]: Test insert features', () => {
  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      adminToken = await getAdminToken();
      await createIndexAsAdmin('index-test');
    });
    describe('POST /logs/index-test - Add [wiley.csv] in [index-test] index', () => {
      it('Should upload ec in index "index-test"', async () => {
        const pathFile = path.resolve(__dirname, '..', '..', 'sources', 'wiley.csv');

        const res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        expect(res).toHaveProperty('status', 200);

        const { data } = res;

        expect(data).toHaveProperty('total', 6);
        expect(data).toHaveProperty('inserted', 5);
        expect(data).toHaveProperty('updated', 1);
        expect(data).toHaveProperty('failed', 0);
        expect(data).toHaveProperty('errors', []);
        expect(data).toHaveProperty('took');
        expect(data?.took).toBeGreaterThan(0);
      });

      afterAll(async () => {
        await deleteIndexAsAdmin('index-test');
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
    // TODO create roles
    describe('POST /logs/index-test - Add [wiley.csv] in [index-test] index who has roles', () => {
      const indexName = 'index-test';

      beforeAll(async () => {
        await createIndexAsAdmin(indexName);
      });

      it('Should get HTTP status 403', async () => {
        const pathFile = path.resolve(__dirname, '..', '..', 'sources', 'wiley.csv');

        const res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        expect(res).toHaveProperty('status', 403);
      });

      afterAll(async () => {
        await deleteIndexAsAdmin('index-test');
      });
    });

    describe('POST /logs/index-test - Add [wiley.csv] in [index-test] index who has not roles', () => {
      const indexName = 'index-test';

      beforeAll(async () => {
        await createIndexAsAdmin(indexName);
      });

      it('Should get HTTP status 403', async () => {
        const pathFile = path.resolve(__dirname, '..', '..', 'sources', 'wiley.csv');

        const res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        expect(res).toHaveProperty('status', 403);
      });

      afterAll(async () => {
        await deleteIndexAsAdmin('index-test');
      });
    });
    afterAll(async () => {
      await deleteUserAsAdmin(userTest.username);
    });
  });
});
