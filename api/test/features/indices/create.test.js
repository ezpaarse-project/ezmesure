const ezmesure = require('../../setup/ezmesure');

const { getAdminToken, getToken } = require('../../setup/login');
const { deleteIndexAsAdmin } = require('../../setup/indices');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');

describe('[indices]: Test create features', () => {
  let adminToken;
  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    describe('PUT /indices/<id> - Create new index', () => {
      const indexName = 'test';

      it('Should create new index [test]', async () => {
        let res;
        try {
          res = await ezmesure({
            method: 'PUT',
            url: `/indices/${indexName}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
        } catch (err) {
          res = err?.response;
        }
        expect(res).toHaveProperty('status', 200);
      });

      afterAll(async () => {
        await deleteIndexAsAdmin(indexName);
      });
    });
  });
  describe('As user', () => {
    describe('PUT /indices/<id> - Create new index', () => {
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
            method: 'PUT',
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
        await deleteUserAsAdmin(userTest.username);
      });
    });
  });

  describe('Without token', () => {
    describe('PUT /indices/<id> - Create new index', () => {
      const indexName = 'test';

      it('Should get HTTP status 401', async () => {
        let res;
        try {
          res = await ezmesure({
            method: 'PUT',
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
