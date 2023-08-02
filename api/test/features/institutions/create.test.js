const ezmesure = require('../../setup/ezmesure');

const { deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test create features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  describe('As admin', () => {
    describe('POST /institutions - Create new institution', () => {
      let institutionId;

      it('Should create new institution [Test]', async () => {
        const res = await ezmesure({
          method: 'POST',
          url: '/institutions',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: institutionTest,
        });

        institutionId = res?.data?.id;
        expect(res).toHaveProperty('status', 201);
      });

      it('Should get institutions', async () => {
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

  describe('As user', () => {
    let userTest;
    let userToken;
    beforeAll(async () => {
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });

    describe('POST /institutions - Create new institution', () => {
      let institutionId;

      it('Should create new institution [Test]', async () => {
        const res = await ezmesure({
          method: 'POST',
          url: '/institutions',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: institutionTest,
        });

        institutionId = res?.data?.id;
        expect(res).toHaveProperty('status', 201);
      });

      it('Should get institution [Test]', async () => {
        const res = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}`,
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
        expect(memberships).toHaveProperty('institutionId', institutionId);
        expect(memberships).toHaveProperty('locked', true);

        const { permissions } = memberships;
        const { roles } = memberships;

        const defaultPermissions = [
          'institution:read',
          'institution:write',
          'memberships:read',
          'memberships:write',
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
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
    afterAll(async () => {
      await deleteUserAsAdmin(userTest.username);
    });
  });

  describe('Without token', () => {
    describe('POST /institutions - Create new institution', () => {
      let institutionId;

      it('Should get HTTP status 401', async () => {
        const res = await ezmesure({
          method: 'POST',
          url: '/institutions',
          data: institutionTest,
        });

        expect(res).toHaveProperty('status', 401);
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
});
