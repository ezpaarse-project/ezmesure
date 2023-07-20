const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { deleteSpaceAsAdmin, createSpaceAsAdmin } = require('../../setup/spaces');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[space]: Test delete spaces features', () => {
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

  let adminToken;
  let institutionId;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    institutionId = await createInstitutionAsAdmin(institution);
  });
  describe('As admin', () => {
    describe('DELETE /kibana-spaces/<id> - delete space [ezPAARSE] for institution [Test]', () => {
      beforeAll(async () => {
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
        await deleteSpaceAsAdmin(spaceConfig.id);
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

    describe('DELETE /kibana-spaces/<id> - delete space [ezPAARSE] for institution [Test]', () => {
      beforeAll(async () => {
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
        await deleteSpaceAsAdmin(spaceConfig.id);
      });
    });
    afterAll(async () => {
      await deleteUserAsAdmin(userTest.username);
    });
  });

  describe('Without token', () => {
    describe('DELETE /kibana-spaces/<id> - delete space [ezPAARSE] for institution [Test]', () => {
      beforeAll(async () => {
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
        await deleteSpaceAsAdmin(spaceConfig.id);
      });
    });
  });
  afterAll(async () => {
    await deleteInstitutionAsAdmin(institutionId);
  });
});
