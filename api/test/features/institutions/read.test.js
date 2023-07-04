const ezmesure = require('../../setup/ezmesure');

const {
  createInstitutionAsAdmin,
  createInstitution,
  deleteInstitutionAsAdmin,
} = require('../../setup/institutions');

const {
  createDefaultActivatedUserAsAdmin,
  deleteUserAsAdmin,
} = require('../../setup/users');

const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test institutions features', () => {
  describe('Read', () => {
    describe('As admin', () => {
      describe('GET /institutions - Get institutions', () => {
        let token;
        let id;

        beforeAll(async () => {
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should get all institutions', async () => {
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

      describe('GET /institutions/<id> - Get institution [Test]', () => {
        let token;
        let id;

        beforeAll(async () => {
          token = await getAdminToken();
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
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

    describe('As user', () => {
      describe('GET /institutions - Get institution with user-test token', () => {
        let token;
        let id;
        let userTest;

        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          token = await getToken(userTest.username, userTest.password);
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should get all institutions', async () => {
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

          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
          await deleteUserAsAdmin(userTest.username);
        });
      });

      describe('GET /institutions/<id> - Get institution [Test] created by user with user-test token', () => {
        let token;
        let id;
        let userTest;

        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          const institution = { name: 'Test', namespace: 'test' };
          token = await getToken(userTest.username, userTest.password);
          id = await createInstitution(institution, userTest);
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
          }

          const institutions = res?.data;

          expect(institutions?.id).not.toBeNull();
          expect(institutions).toHaveProperty('parentInstitutionId', null);
          expect(institutions?.createdAt).not.toBeNull();
          expect(institutions?.updatedAt).not.toBeNull();
          expect(institutions).toHaveProperty('name', 'Test');
          expect(institutions).toHaveProperty('namespace', null);
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

          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
          await deleteUserAsAdmin(userTest.username);
        });
      });

      describe('GET /institutions/<id> - Get institution [Test] created by admin with user-test token', () => {
        let token;
        let id;
        let userTest;

        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          token = await getToken(userTest.username, userTest.password);
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
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
          }

          const institutions = res?.data;

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

          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });

    describe('Without token', () => {
      describe('GET /institutions - Get institutions', () => {
        let id;
        beforeAll(async () => {
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

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

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });

      describe('GET /institutions/<id> - Get institution [Test]', () => {
        let id;

        beforeAll(async () => {
          id = await createInstitutionAsAdmin({ name: 'Test', namespace: 'test' });
        });

        it('Should get HTTP status 401', async () => {
          let res;
          try {
            res = await ezmesure({
              method: 'GET',
              url: `/institutions/${id}`,
            });
          } catch (err) {
            res = err?.response;
          }

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
        });
      });
    });
  });
});
