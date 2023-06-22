const ezmesure = require('../../setup/ezmesure');

const { createInstitution, createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test institutions features', () => {
  describe('Update', () => {
    describe('Admin', () => {
      describe('PUT /institutions/<id> - Update institution [Test] with admin token', () => {
        let token;
        let id;

        beforeAll(async () => {
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should update institution [Test]', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'PUT',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
              data: {
                name: 'Test2',
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
          expect(institution).toHaveProperty('name', 'Test2');
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
      describe('PUT /institutions/<id> - Update institution created by user with user token', () => {
        let userToken;
        let id;
        let userTest;
        beforeAll(async () => {
          const institution = {
            name: 'Test',
            namespace: 'test',
          };
          userTest = await createDefaultActivatedUserAsAdmin();
          id = await createInstitution(institution, userTest);
          userToken = await getToken(userTest.username, userTest.password);
        });

        it('Should update institution [Test] to [Test2]', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'PUT',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: {
                name: 'Test2',
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test2] with change', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
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
          expect(institution).toHaveProperty('name', 'Test2');
          expect(institution).toHaveProperty('namespace', null);
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
          await deleteUserAsAdmin(userTest.username);
        });
      });

      describe('PUT /institutions/<id> - Update institution created by admin with admin token', () => {
        let adminToken;
        let id;
        let userTest;
        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          adminToken = await getToken(userTest.username, userTest.password);
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should get HTTP status 403', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'PUT',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: {
                name: 'Test2',
              },
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 403);
        });

        it('Should get institution [Test] with any change', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: `/institutions/${id}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
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
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });
    describe('Without token', () => {
      describe('PUT /institutions/<id> - Update institution without token', () => {
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

        it('Should get institution with any changes', async () => {
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
