const ezmesure = require('./setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('./setup/institutions');
const { createUserAsAdmin, deleteUserAsAdmin, activateUser } = require('./setup/users');
const { getAdminToken } = require('./setup/login');

describe('[institutions]: Test institutions features', () => {
  describe('Read', () => {
    describe('Admin', () => {
      describe('GET /institution - Get institution with ezmesure-admin token', () => {
        let token;
        let id;

        beforeAll(async () => {
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should get institutions', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: '/institutions',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 200);

          const institutions = res?.data[0];

          expect(institutions?.id).not.toBeNull();
          expect(institutions).toHaveProperty('parentInstitutionId', null);
          expect(institutions?.createdAt).not.toBeNull();
          expect(institutions?.updatedAt).not.toBeNull();
          expect(institutions).toHaveProperty('name', 'Test');
          expect(institutions).toHaveProperty('namespace', 'test');
          expect(institutions).toHaveProperty('validated', false);
          expect(institutions).toHaveProperty('hidePartner', false);
          expect(institutions).toHaveProperty('tags', []);
          expect(institutions).toHaveProperty('logoId', null);
          expect(institutions).toHaveProperty('type', null);
          expect(institutions).toHaveProperty('acronym', null);
          expect(institutions).toHaveProperty('websiteUrl', null);
          expect(institutions).toHaveProperty('city', null);
          expect(institutions).toHaveProperty('uai', null);
          expect(institutions).toHaveProperty('social', null);
          expect(institutions).toHaveProperty('sushiReadySince', null);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });

      describe('GET /institution/<id> - Get institution test with ezmesure-admin token', () => {
        let token;
        let id;

        beforeAll(async () => {
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should get institution "Test"', async () => {
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
          }

          expect(res).toHaveProperty('status', 200);

          const institution = res?.data;

          expect(institution?.id).not.toBeNull();
          expect(institution).toHaveProperty('parentInstitutionId', null);
          expect(institution?.createdAt).not.toBeNull();
          expect(institution?.updatedAt).not.toBeNull();
          expect(institution).toHaveProperty('name', 'Test');
          expect(institution).toHaveProperty('namespace', 'test');
          expect(institution).toHaveProperty('validated', false);
          expect(institution).toHaveProperty('hidePartner', false);
          expect(institution).toHaveProperty('tags', []);
          expect(institution).toHaveProperty('logoId', null);
          expect(institution).toHaveProperty('type', null);
          expect(institution).toHaveProperty('acronym', null);
          expect(institution).toHaveProperty('websiteUrl', null);
          expect(institution).toHaveProperty('city', null);
          expect(institution).toHaveProperty('uai', null);
          expect(institution).toHaveProperty('social', null);
          expect(institution).toHaveProperty('sushiReadySince', null);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });
    });

    describe('User', () => {

    });

    describe('Security', () => {
      describe('GET /institutions - Get institutions without token', () => {
        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: '/institutions',
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 401);
        });
      });
    });
  });
  describe('Create', () => {
    describe('Admin', () => {
      describe('POST /institutions - Create new institution with ezmesure-admin token', () => {
        let token;
        let id;
        beforeAll(async () => {
          token = await getAdminToken();
        });

        it('Should create new institution "Test"', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'POST',
              url: '/institutions',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              data: {
                name: 'Test',
                namespace: 'test',
              },
            });
          } catch (err) {
            res = err?.response;
          }

          id = res?.data?.id;
          expect(res).toHaveProperty('status', 201);
        });

        it('Should get institutions', async () => {
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
          }

          expect(res).toHaveProperty('status', 200);

          const institution = res?.data;

          expect(institution?.id).not.toBeNull();
          expect(institution).toHaveProperty('parentInstitutionId', null);
          expect(institution?.createdAt).not.toBeNull();
          expect(institution?.updatedAt).not.toBeNull();
          expect(institution).toHaveProperty('name', 'Test');
          expect(institution).toHaveProperty('namespace', 'test');
          expect(institution).toHaveProperty('validated', false);
          expect(institution).toHaveProperty('hidePartner', false);
          expect(institution).toHaveProperty('tags', []);
          expect(institution).toHaveProperty('logoId', null);
          expect(institution).toHaveProperty('type', null);
          expect(institution).toHaveProperty('acronym', null);
          expect(institution).toHaveProperty('websiteUrl', null);
          expect(institution).toHaveProperty('city', null);
          expect(institution).toHaveProperty('uai', null);
          expect(institution).toHaveProperty('social', null);
          expect(institution).toHaveProperty('sushiReadySince', null);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });
    });
    describe('Users', () => {

    });

    describe('Security', () => {
      describe('POST /institutions - Create new institution without token', () => {
        let id;
        let token;
        beforeAll(async () => {
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'POST',
              url: '/institutions',
              data: {
                name: 'Test',
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution "Test"', async () => {
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
          }

          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });
    });
  });
  describe('Delete', () => {
    describe('Admin', () => {
      describe('DELETE /institutions/<id> - delete institution with ezmesure-admin token', () => {
        let token;
        let id;
        beforeAll(async () => {
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should delete institution "test"', async () => {
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
      describe('DELETE /institutions/<id> - delete institution with user token', () => {
        let token;
        let id;
        beforeAll(async () => {
          await createUserAsAdmin('user.test', 'user.test@test.fr', 'User test', false);
          await activateUser('user.test', 'changeme');
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should delete institution "test" ', async () => {
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
          await deleteUserAsAdmin('user.test');
        });
      });
    });
    describe('Security', () => {
      describe('DELETE /institutions/<id> - delete institution without token', () => {
        let id;
        beforeAll(async () => {
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
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

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });
    });
  });
  describe('Update', () => {
    describe('Admin', () => {
    });
    describe('User', () => {
    });
    describe('Security', () => {
      describe('UPDATE /institutions/<id> - update institution without token', () => {
        let id;
        let token;
        beforeAll(async () => {
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'PUT',
              url: `/institutions/${id}`,
              data: {
                name: 'Test2',
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            res = err?.response;
            return;
          }
          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: `/institutions/${id}`,
            });
          } catch (err) {
            res = err?.response;
            return;
          }

          expect(res).toHaveProperty('status', 200);

          const institution = res?.data;

          expect(institution?.id).not.toBeNull();
          expect(institution).toHaveProperty('parentInstitutionId', null);
          expect(institution?.createdAt).not.toBeNull();
          expect(institution?.updatedAt).not.toBeNull();
          expect(institution).toHaveProperty('name', 'Test');
          expect(institution).toHaveProperty('namespace', 'test');
          expect(institution).toHaveProperty('validated', false);
          expect(institution).toHaveProperty('hidePartner', false);
          expect(institution).toHaveProperty('tags', []);
          expect(institution).toHaveProperty('logoId', null);
          expect(institution).toHaveProperty('type', null);
          expect(institution).toHaveProperty('acronym', null);
          expect(institution).toHaveProperty('websiteUrl', null);
          expect(institution).toHaveProperty('city', null);
          expect(institution).toHaveProperty('uai', null);
          expect(institution).toHaveProperty('social', null);
          expect(institution).toHaveProperty('sushiReadySince', null);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });
    });
  });
});
