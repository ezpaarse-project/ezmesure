const ezmesure = require('../../setup/ezmesure');

const { getAdminToken, getToken } = require('../../setup/login');
const { createIndexAsAdmin, deleteIndexAsAdmin } = require('../../setup/indices');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');

describe('[indices]: Test indices features', () => {
  describe('Create', () => {
    describe('As admin', () => {
      describe('PUT /indices/<id> - Create new index', () => {
        let adminToken;
        const indexName = 'test';
        beforeAll(async () => {
          adminToken = await getAdminToken();
        });

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
  describe('Delete', () => {
    describe('As admin', () => {
      describe('DELETE /indices/<id> - Delete index', () => {
        let adminToken;
        const indexName = 'test';

        beforeAll(async () => {
          adminToken = await getAdminToken();
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
});
