const ezmesure = require('../utils/ezmesure');

const login = require('../utils/login');
const { createUser, deleteUser } = require('../utils/users');
const { createIndex, deleteIndex } = require('../utils/indices');

describe('GET /indices', () => {
  describe('GET /indices/index-test - get indice "index-test" with ezmesure-token', () => {
    let token;
    beforeAll(async () => {
      await createIndex('index-test');
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get indice', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/indices/index-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res?.data).toHaveProperty('index-test');
    });

    afterAll(async () => {
      await deleteIndex('index-test');
    });
  });

  describe('GET /indices/index-test - get indice "indice" with ezmesure-token', () => {
    let token;
    beforeAll(async () => {
      await createIndex('index-test');
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get HTTP status 404', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/indices/indice',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 404);
    });

    afterAll(async () => {
      await deleteIndex('index-test');
    });
  });

  describe('GET /indices/index-test - get indice "index-test" without token', () => {
    beforeAll(async () => {
      await createIndex('index-test');
    });

    it('Should get HTTP status 401', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/indices/index-test',
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

  describe('GET /indices/index-test - get indice "index-test" with user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
      await createIndex('index-test');
    });

    it('Should get HTTP status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/indices/index-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 403);
    });

    afterAll(async () => {
      await deleteIndex('index-test');
      await deleteUser('user01');
    });
  });
});

describe('PUT /indices', () => {
  describe('PUT /indices/index-test - create new indice with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should add indice "index-test"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/indices/index-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res).toHaveProperty('status', 200);
    });

    it('Should get indice', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'GET',
          url: '/indices/index-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }

      expect(res?.data).toHaveProperty('index-test');
    });

    afterAll(async () => {
      await deleteIndex('index-test');
    });
  });

  describe('PUT /indices/index-test - create new indice without token', () => {
    it('Should get HTTP status 401', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/indices/index-test',
        });
      } catch (err) {
        res = err?.response;
      }
      expect(res).toHaveProperty('status', 401);
    });
  });

  describe('PUT /indices/index-test - create new indice with user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
    });

    it('Should get HTTP status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'PUT',
          url: '/indices/index-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }
      expect(res).toHaveProperty('status', 403);
    });

    afterAll(async () => {
      await deleteIndex('index-test');
      await deleteUser('user01');
    });
  });
});

describe('DELETE /indices/index-test', () => {
  describe('DELETE /indices/index-test - delete indice "index-test" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      await createIndex('index-test');
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should delete indice "index-test"', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/indices/index-test',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }
      expect(res).toHaveProperty('status', 204);
    });

    afterAll(async () => {
      await deleteIndex('index-test');
    });
  });

  describe('DELETE /indices/index-test - delete indice "indice" with ezmesure-admin token', () => {
    let token;
    beforeAll(async () => {
      token = await login('ezmesure-admin', 'changeme');
    });

    it('Should get HTTP status 404', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/indices/indice',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        res = err?.response;
      }
      expect(res).toHaveProperty('status', 404);
    });
  });

  describe('DELETE /indices/index-test - delete indice "index-test" without token', () => {
    beforeAll(async () => {
      await createIndex('index-test');
    });

    it('Should get HTTP status 401', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/indices/index-test',
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

  describe('DELETE /indices/index-test - delete indice "index-test" with user01 token', () => {
    let token;
    beforeAll(async () => {
      await createUser('user01', 'password', []);
      token = await login('user01', 'password');
      await createIndex('index-test');
    });

    it('Should get HTTP status 403', async () => {
      let res;
      try {
        res = await ezmesure({
          method: 'DELETE',
          url: '/indices/index-test',
          headers: {
            Authorization: `Bearer ${token}`,
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
});
