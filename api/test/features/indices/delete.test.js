const ezmesure = require('../../setup/ezmesure');

const { getAdminToken, getToken } = require('../../setup/login');
const { createIndexAsAdmin, deleteIndexAsAdmin } = require('../../setup/indices');
const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');

describe('[indices]: Test delete features', () => {
  let adminToken;
  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    describe('DELETE /indices/<id> - Delete index', () => {
      const indexName = 'test';

      beforeAll(async () => {
        await createIndexAsAdmin(indexName);
      });

      it('Should delete index [test]', async () => {
        let res;
        try {
          res = await ezmesure({
            method: 'DELETE',
            url: `/indices/${indexName}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
        } catch (err) {
          res = err?.response;
        }
        expect(res).toHaveProperty('status', 204);
      });

      afterAll(async () => {
        await deleteIndexAsAdmin(indexName);
      });
    });
  });
  describe('As user', () => {
    describe('DELETE /indices/<id> - Delete index', () => {
      let userTest;
      let userToken;
      const indexName = 'test';

      beforeAll(async () => {
        userTest = await createDefaultActivatedUserAsAdmin();
        userToken = await getToken(userTest.username, userTest.password);
      });

      it('Should get HTTP status 403', async () => {
        let res;
        try {
          res = await ezmesure({
            method: 'DELETE',
            url: `/indices/${indexName}`,
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
        await deleteIndexAsAdmin(indexName);
      });
    });
  });
  describe('With random token', () => {
    describe('DELETE /indices/<id> - Delete index', () => {
      const indexName = 'test';

      it('Should get HTTP status 401', async () => {
        let res;
        try {
          res = await ezmesure({
            method: 'DELETE',
            url: `/indices/${indexName}`,
            headers: {
              Authorization: 'Bearer: random',
            },
          });
        } catch (err) {
          res = err?.response;
        }
        expect(res).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await deleteIndexAsAdmin(indexName);
      });
    });
  });
  describe('Without token', () => {
    describe('DELETE /indices/<id> - Delete index', () => {
      const indexName = 'test';

      it('Should get HTTP status 401', async () => {
        let res;
        try {
          res = await ezmesure({
            method: 'DELETE',
            url: `/indices/${indexName}`,
          });
        } catch (err) {
          res = err?.response;
        }
        expect(res).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await deleteIndexAsAdmin(indexName);
      });
    });
  });
});
