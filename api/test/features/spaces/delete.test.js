const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { deleteSpaceAsAdmin, createSpaceAsAdmin } = require('../../setup/spaces');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[space]: Test spaces features', () => {
  describe('Delete', () => {
    const spaceConfig = {
      id: 'test-ezpaarse-id',
      institutionId: '',
      type: 'ezpaarse',
      name: 'test-ezpaarse-name',
      description: 'ezpaarse space for test institution',
      initials: 'EZ',
    };

    const institution = {
      name: 'Test',
      namespace: 'test',
    };

    describe('As admin', () => {
      describe('DELETE /kibana-spaces/<id> - delete space [ezPAARSE] for institution [Test]', () => {
        let adminToken;
        let institutionId;
        beforeAll(async () => {
          adminToken = await getAdminToken();
          institutionId = await createInstitutionAsAdmin(institution);
          spaceConfig.institutionId = institutionId;
          await createSpaceAsAdmin(spaceConfig);
        });

        it('Should delete space', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/kibana-spaces/${spaceConfig.id}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 204);
        });

        it('Should get HTTP status 404', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/kibana-spaces/${spaceConfig.id}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 404);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteSpaceAsAdmin(spaceConfig.id);
        });
      });
    });

    describe('As user', () => {
      describe('DELETE /kibana-spaces/<id> - delete space [ezPAARSE] for institution [Test]', () => {
        let adminToken;

        let userTest;
        let userToken;

        let institutionId;
        beforeAll(async () => {
          adminToken = await getAdminToken();
          userTest = await createDefaultActivatedUserAsAdmin();
          userToken = await getToken(userTest.username, userTest.password);
          institutionId = await createInstitutionAsAdmin(institution);
          spaceConfig.institutionId = institutionId;
          await createSpaceAsAdmin(spaceConfig);
        });

        it('Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/kibana-spaces/${spaceConfig.id}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });
          expect(res).toHaveProperty('status', 403);
        });

        it('Should get space', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/kibana-spaces/${spaceConfig.id}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteSpaceAsAdmin(spaceConfig.id);
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });

    describe('Without token', () => {
      describe('DELETE /kibana-spaces/<id> - delete space [ezPAARSE] for institution [Test]', () => {
        let adminToken;
        let institutionId;

        beforeAll(async () => {
          adminToken = await getAdminToken();

          institutionId = await createInstitutionAsAdmin(institution);
          spaceConfig.institutionId = institutionId;

          await createSpaceAsAdmin(spaceConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/kibana-spaces/${spaceConfig.id}`,
          });
          expect(res).toHaveProperty('status', 401);
        });

        it('Should get space', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/kibana-spaces/${spaceConfig.id}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteSpaceAsAdmin(spaceConfig.id);
        });
      });
    });
  });
});
