const ezmesure = require('../../setup/ezmesure');

const { createInstitution, createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test institutions features', () => {
  describe('Update', () => {
    const institutionTest = {
      name: 'Test',
      namespace: 'test',
    };
    describe('As admin', () => {
      describe('PUT /institutions/<id> - Update institution [Test]', () => {
        let adminToken;
        let institutionId;

        beforeAll(async () => {
          adminToken = await getAdminToken();
          institutionId = await createInstitutionAsAdmin(institutionTest);
        });

        it('Should update institution [Test]', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: {
              name: 'Test2',
            },
          });

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
          await deleteInstitutionAsAdmin(institutionId);
        });
      });
    });
    describe('As user', () => {
      describe('PUT /institutions/<id> - Update institution created by user', () => {
        let userToken;
        let id;
        let userTest;
        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          id = await createInstitution(institutionTest, userTest);
          userToken = await getToken(userTest.username, userTest.password);
        });

        it('Should update institution [Test] to [Test2]', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: `/institutions/${id}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: {
              name: 'Test2',
            },
          });

          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test2] with change', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${id}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

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

      describe('PUT /institutions/<id> - Update institution created by admin', () => {
        let adminToken;
        let institutionId;
        let userTest;
        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          adminToken = await getToken(userTest.username, userTest.password);
          institutionId = await createInstitutionAsAdmin(institutionTest);
        });

        it('Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: {
              name: 'Test2',
            },
          });

          expect(res).toHaveProperty('status', 403);
        });

        it('Should get institution [Test] with any change', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

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
          await deleteInstitutionAsAdmin(institutionId);
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });
    describe('Without token', () => {
      describe('PUT /institutions/<id> - Update institution', () => {
        let institutionId;
        let adminToken;
        beforeAll(async () => {
          adminToken = await getAdminToken();
          institutionId = await createInstitutionAsAdmin(institutionTest);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}`,
            data: {
              name: 'Test2',
            },
          });
          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution with any changes', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

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
          await deleteInstitutionAsAdmin(institutionId);
        });
      });
    });
  });
});
