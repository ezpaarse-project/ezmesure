const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { createSpaceAsAdmin, deleteSpaceAsAdmin } = require('../../setup/spaces');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[space]: Test spaces features', () => {
  describe('Create', () => {
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
      describe('PATCH /kibana-spaces/<id> - Update space [ezPAARSE] for institution [Test]', () => {
        let adminToken;
        let institutionId;
        beforeAll(async () => {
          adminToken = await getAdminToken();

          institutionId = await createInstitutionAsAdmin(institution);
          spaceConfig.institutionId = institutionId;

          await createSpaceAsAdmin(spaceConfig);
        });

        it('Should update space', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/kibana-spaces/${spaceConfig.id}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: {
              name: 'test-ezpaarse-name-updated',
              description: 'ezpaarse space for test institution updated',
            },
          });

          expect(res).toHaveProperty('status', 200);

          const space = res?.data;

          expect(space?.id).not.toBeNull();
          expect(space).toHaveProperty('institutionId', institutionId);
          expect(space?.createdAt).not.toBeNull();
          expect(space?.updatedAt).not.toBeNull();
          expect(space).toHaveProperty('name', 'test-ezpaarse-name-updated');
          expect(space).toHaveProperty('description', 'ezpaarse space for test institution updated');
          expect(space).toHaveProperty('initials', spaceConfig.initials);
          expect(space).toHaveProperty('color', null);
          expect(space).toHaveProperty('type', spaceConfig.type);
          expect(space).toHaveProperty('indexPatterns', []);
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

          const space = res?.data;

          expect(space?.id).not.toBeNull();
          expect(space).toHaveProperty('institutionId', institutionId);
          expect(space?.createdAt).not.toBeNull();
          expect(space?.updatedAt).not.toBeNull();
          expect(space).toHaveProperty('name', 'test-ezpaarse-name-updated');
          expect(space).toHaveProperty('description', 'ezpaarse space for test institution updated');
          expect(space).toHaveProperty('initials', spaceConfig.initials);
          expect(space).toHaveProperty('color', null);
          expect(space).toHaveProperty('type', spaceConfig.type);
          expect(space).toHaveProperty('indexPatterns', []);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteSpaceAsAdmin(spaceConfig.id);
        });
      });
    });

    describe('As user', () => {
      describe('PATCH /kibana-spaces/<id> - Update space [ezPAARSE] for institution [Test]', () => {
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
            method: 'PATCH',
            url: `/kibana-spaces/${spaceConfig.id}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: {
              name: 'test-ezpaarse-name-updated',
              description: 'ezpaarse space for test institution updated',
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

          const space = res?.data;

          expect(space?.id).not.toBeNull();
          expect(space).toHaveProperty('institutionId', institutionId);
          expect(space?.createdAt).not.toBeNull();
          expect(space?.updatedAt).not.toBeNull();
          expect(space).toHaveProperty('name', spaceConfig.name);
          expect(space).toHaveProperty('description', spaceConfig.description);
          expect(space).toHaveProperty('initials', spaceConfig.initials);
          expect(space).toHaveProperty('color', null);
          expect(space).toHaveProperty('type', spaceConfig.type);
          expect(space).toHaveProperty('indexPatterns', []);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteSpaceAsAdmin(spaceConfig.id);
          await deleteUserAsAdmin(userTest.username);
        });
      });
    });

    describe('Without token', () => {
      describe('PATCH /kibana-spaces/<id> - Update space [ezPAARSE] for institution [Test]', () => {
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
            method: 'PATCH',
            url: `/kibana-spaces/${spaceConfig.id}`,
            data: {
              name: 'test-ezpaarse-name-updated',
              description: 'ezpaarse space for test institution updated',
            },
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

          const space = res?.data;

          expect(space?.id).not.toBeNull();
          expect(space).toHaveProperty('institutionId', institutionId);
          expect(space?.createdAt).not.toBeNull();
          expect(space?.updatedAt).not.toBeNull();
          expect(space).toHaveProperty('name', spaceConfig.name);
          expect(space).toHaveProperty('description', spaceConfig.description);
          expect(space).toHaveProperty('initials', spaceConfig.initials);
          expect(space).toHaveProperty('color', null);
          expect(space).toHaveProperty('type', spaceConfig.type);
          expect(space).toHaveProperty('indexPatterns', []);
        });

        afterAll(async () => {
          await deleteInstitutionAsAdmin(institutionId);
          await deleteSpaceAsAdmin(spaceConfig.id);
        });
      });
    });
  });
});
