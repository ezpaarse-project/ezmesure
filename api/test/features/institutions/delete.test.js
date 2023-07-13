const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createUserAsAdmin, deleteUserAsAdmin, activateUser } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[institutions]: Test institutions features', () => {
  describe('Delete', () => {
    const institutionTest = {
      name: 'Test',
      namespace: 'test',
    };
    describe('As admin', () => {
      describe('DELETE /institutions/<id> - Delete institution', () => {
        let adminToken;
        let institutionId;

        beforeAll(async () => {
          adminToken = await getAdminToken();
          institutionId = await createInstitutionAsAdmin(institutionTest);
        });

        it('Should delete institution [Test]', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get HTTP status 404', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 404);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
        });
      });
    });
    describe('As user', () => {
      describe('DELETE /institutions/<id> - Delete institution', () => {
        let userToken;
        let institutionId;
        let userTest;

        beforeAll(async () => {
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
          userToken = await getAdminToken();
          institutionId = await createInstitutionAsAdmin(institutionTest);
        });

        it('Should delete institution [Test] ', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get HTTP status 404', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          expect(res).toHaveProperty('status', 404);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });
    describe('Without token', () => {
      describe('DELETE /institutions/<id> - Delete institution', () => {
        let institutionId;
        let adminToken;

        beforeAll(async () => {
          institutionId = await createInstitutionAsAdmin(institutionTest);
          adminToken = await getAdminToken();
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/institutions/${institutionId}`,
          });
          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution [Test]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
        });
      });
    });
  });
});
