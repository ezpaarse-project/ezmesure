const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, validateInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { deleteSpaceAsAdmin } = require('../../setup/spaces');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[space]: Test create spaces features', () => {
  let adminToken;

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

  let institutionId;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    institutionId = await createInstitutionAsAdmin(institution);
    spaceConfig.institutionId = institutionId;
  });

  describe('Unvalidated institution', () => {
    describe('As admin', () => {
      describe('POST /kibana-spaces - Create new space [ezPAARSE] for institution [Test]', () => {
        it('Should create space', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/kibana-spaces/',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: spaceConfig,
          });
          expect(res).toHaveProperty('status', 201);
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
      describe('POST /kibana-spaces - Create new space [ezPAARSE] for institution [Test]', () => {
        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          userToken = await getToken(userTest.username, userTest.password);
        });

        it('Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/kibana-spaces/',
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: spaceConfig,
          });

          expect(res).toHaveProperty('status', 403);
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
      });
      afterAll(async () => {
        await deleteSpaceAsAdmin(spaceConfig.id);
        await deleteUserAsAdmin(userTest.username);
      });
    });
    describe('With random token', () => {
      describe('POST /kibana-spaces - Create new space [ezPAARSE] for institution [Test]', () => {
        beforeAll(async () => {
          spaceConfig.institutionId = institutionId;
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/kibana-spaces/',
            data: spaceConfig,
            headers: {
              Authorization: 'Bearer: random',
            },
          });

          expect(res).toHaveProperty('status', 401);
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
    describe('Without token', () => {
      describe('POST /kibana-spaces - Create new space [ezPAARSE] for institution [Test]', () => {
        beforeAll(async () => {
          spaceConfig.institutionId = institutionId;
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/kibana-spaces/',
            data: spaceConfig,
          });

          expect(res).toHaveProperty('status', 401);
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
  });

  describe('Validated institution', () => {
    beforeAll(async () => {
      await validateInstitutionAsAdmin(institutionId);
    });
    describe('As admin', () => {
      describe('POST /kibana-spaces - Create new space [ezPAARSE] for institution [Test]', () => {
        it('Should create space', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/kibana-spaces/',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: spaceConfig,
          });
          expect(res).toHaveProperty('status', 201);
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
      describe('POST /kibana-spaces - Create new space [ezPAARSE] for institution [Test]', () => {
        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          userToken = await getToken(userTest.username, userTest.password);
        });

        it('Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/kibana-spaces/',
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: spaceConfig,
          });

          expect(res).toHaveProperty('status', 403);
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
      });
      afterAll(async () => {
        await deleteSpaceAsAdmin(spaceConfig.id);
        await deleteUserAsAdmin(userTest.username);
      });
    });
    describe('With random token', () => {
      describe('POST /kibana-spaces - Create new space [ezPAARSE] for institution [Test]', () => {
        beforeAll(async () => {
          spaceConfig.institutionId = institutionId;
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/kibana-spaces/',
            data: spaceConfig,
            headers: {
              Authorization: 'Bearer: random',
            },
          });

          expect(res).toHaveProperty('status', 401);
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
    describe('Without token', () => {
      describe('POST /kibana-spaces - Create new space [ezPAARSE] for institution [Test]', () => {
        beforeAll(async () => {
          spaceConfig.institutionId = institutionId;
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/kibana-spaces/',
            data: spaceConfig,
          });

          expect(res).toHaveProperty('status', 401);
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
  });

  afterAll(async () => {
    await deleteInstitutionAsAdmin(institutionId);
  });
});
