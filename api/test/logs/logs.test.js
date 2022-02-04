const path = require('path');
const fs = require('fs-extra');

const ezmesure = require('../setup/ezmesure');

const login = require('../setup/login');
const { createIndex, deleteIndex } = require('../setup/indices');
const { createUser, deleteUser } = require('../setup/users');
const { createRole, deleteRole } = require('../setup/roles');

describe('POST /logs/index-test', () => {
  describe('POST /logs/index-test - add wiley.csv in "index-test" with ezmesure-admin token', () => {
    let adminToken;
    beforeAll(async () => {
      adminToken = await login('ezmesure-admin', 'changeme');
      await createIndex('index-test');
    });

    it('Should upload ec in index "index-test"', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley.csv');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

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
      await deleteIndex('index-test');
    });
  });

  describe('POST /logs/index-test - add wiley.csv in "index-test" with user01 token', () => {
    let userToken;
    beforeAll(async () => {
      await createUser('user01', 'password', ['role-test']);
      userToken = await login('user01', 'password');
      await createIndex('index-test');
      await createRole('role-test', [{ names: ['index-test'], privileges: ['all'] }]);
    });

    it('Should upload ec in index "index-test"', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley.csv');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

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
      await deleteUser('user01');
      await deleteIndex('index-test');
      await deleteRole('role-test');
    });
  });

  describe('POST /logs/index-test - add wiley.csv in "index-test" with user01 token 2 times', () => {
    let userToken;
    beforeAll(async () => {
      await createUser('user01', 'password', ['role-test']);
      userToken = await login('user01', 'password');
      await createIndex('index-test');
      await createRole('role-test', [{ names: ['index-test'], privileges: ['all'] }]);
    });

    it('Should upload ec in index "index-test"', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley.csv');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

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

    it('Should upload ec in index "index-test" again', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley.csv');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 200);

      const { data } = res;

      expect(data).toHaveProperty('total', 6);
      expect(data).toHaveProperty('inserted', 0);
      expect(data).toHaveProperty('updated', 6);
      expect(data).toHaveProperty('failed', 0);
      expect(data).toHaveProperty('errors', []);
      expect(data).toHaveProperty('took');
      expect(data?.took).toBeGreaterThan(0);
    });

    afterAll(async () => {
      await deleteUser('user01');
      await deleteIndex('index-test');
      await deleteRole('role-test');
    });
  });

  describe('POST /logs/index-test - add wiley.csv in "index-test" with user01 token and without role', () => {
    let userToken;

    beforeAll(async () => {
      await createUser('user01', 'password', ['role-test']);
      userToken = await login('user01', 'password');
      await createIndex('index-test');
    });

    it('Should get http status 403', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley.csv');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 403);
    });

    afterAll(async () => {
      await deleteUser('user01');
      await deleteIndex('index-test');
    });
  });

  describe('POST /logs/index-test - add wiley.json in "index-test" without token', () => {
    beforeAll(async () => {
      await createIndex('index-test');
    });

    it('Should get http status 401', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley.json');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await deleteIndex('index-test');
    });
  });

  describe('POST /logs/index-test - add wiley-coma.csv in "index-test" with user01 token', () => {
    let userToken;
    beforeAll(async () => {
      await createUser('user01', 'password', ['role-test']);
      userToken = await login('user01', 'password');
      await createIndex('index-test');
      await createRole('role-test', [{ names: ['index-test'], privileges: ['all'] }]);
    });

    it('Should get http status 400', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley-coma.csv');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 400);
    });

    afterAll(async () => {
      await deleteUser('user01');
      await deleteIndex('index-test');
      await deleteRole('role-test');
    });
  });

  describe('POST /logs/index-test - add wiley-corrupted.csv in "index-test" with user01 token', () => {
    let userToken;
    beforeAll(async () => {
      await createUser('user01', 'password', ['role-test']);
      userToken = await login('user01', 'password');
      await createIndex('index-test');
      await createRole('role-test', [{ names: ['index-test'], privileges: ['all'] }]);
    });

    it('Should get http status 400', async () => {
      const pathFile = path.resolve(__dirname, '..', 'sources', 'wiley-corrupted.csv');

      let res;
      try {
        res = await ezmesure({
          method: 'POST',
          url: '/logs/index-test',
          data: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 400);
    });

    afterAll(async () => {
      await deleteUser('user01');
      await deleteIndex('index-test');
      await deleteRole('role-test');
    });
  });
});
