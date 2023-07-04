const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test institutions features', () => {
  describe('Create', () => {
    describe('As admin', () => {
      describe('POST /institutions - Create new institution', () => {
        let token;
        let id;
        beforeAll(async () => {
          token = await getAdminToken();
        });

        it('Should create new institution [Test]', async () => {
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

    describe('As user', () => {
      describe('POST /institutions - Create new institution', () => {
        let userTest;
        let token;
        let id;
        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          token = await getToken(userTest.username, userTest.password);
        });

        it('Should create new institution [Test]', async () => {
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

          const memberships = institution?.memberships[0];

          expect(memberships).toHaveProperty('username', 'user.test');
          expect(memberships).toHaveProperty('institutionId', id);
          expect(memberships).toHaveProperty('locked', true);

          const { permissions } = memberships;
          const { roles } = memberships;

          const defaultPermissions = [
            'institution:read',
            'institution:write',
            'memberships:read',
            'memberships:write',
            'memberships:revoke',
            'sushi:read',
            'sushi:write',
            'sushi:delete',
            'reporting:read',
            'reporting:write',
          ];

          const defaultRoles = ['contact:doc', 'contact:tech'];

          expect(permissions.sort()).toEqual(defaultPermissions.sort());
          expect(roles.sort()).toEqual(defaultRoles.sort());
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(id);
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });

    describe('Without token', () => {
      describe('POST /institutions - Create new institution', () => {
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
                name: 'Test2',
              },
            });
          } catch (err) {
            res = err?.response;
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
