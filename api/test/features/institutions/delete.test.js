const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createUserAsAdmin, deleteUserAsAdmin, activateUser } = require('../../setup/users');
const { getAdminToken } = require('../../setup/login');

describe('[institutions]: Test institutions features', () => {
  describe('Delete', () => {
    describe('Admin', () => {
      describe('DELETE /institutions/<id> - Delete institution with admin token', () => {
        let token;
        let id;
        beforeAll(async () => {
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should delete institution [Test]', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'DELETE',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
            return;
          }
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get HTTP status 404', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
            return;
          }

          expect(res).toHaveProperty('status', 404);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });
    });
    describe('User', () => {
      describe('DELETE /institutions/<id> - Delete institution with user token', () => {
        let token;
        let id;
        let userTest;

        beforeAll(async () => {
          userTest = await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should delete institution [Test] ', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'DELETE',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
            return;
          }
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get HTTP status 404', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
            return;
          }

          expect(res).toHaveProperty('status', 404);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });
    describe('Without token', () => {
      describe('DELETE /institutions/<id> - Delete institution without token', () => {
        let id;
        let token;
        beforeAll(async () => {
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
          token = await getAdminToken();
        });

        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'DELETE',
              url: `/institutions/${id}`,
            });
          } catch (err) {
            res = err?.response;
            return;
          }
          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution [Test]', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
            return;
          }

          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });
    });
  });
});
