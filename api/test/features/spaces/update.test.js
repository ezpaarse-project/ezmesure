const ezmesure = require('../../setup/ezmesure');

const spacesService = require('../../../lib/entities/spaces.service');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[space]: Test update spaces features', () => {
  const spaceConfig = {
    id: 'test-ezpaarse-id',
    institutionId: '',
    type: 'ezpaarse',
    name: 'test-ezpaarse-name',
    description: 'ezpaarse space for test institution',
    initials: 'EZ',
  };

  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  const spaceConfigUpdate = {
    name: 'test-ezpaarse-name-updated',
    description: 'ezpaarse space for test institution updated',
  };

  let adminToken;
  let institutionId;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const institution = await institutionsService.create({ data: institutionTest });
    institutionId = institution.id;
  });

  describe('As admin', () => {
    describe(`Update space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      let spaceId;

      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        const space = await spacesService.create({ data: spaceConfig });
        spaceId = space.id;
      });

      it('Should update space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PATCH',
          url: `/kibana-spaces/${spaceConfig.id}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: spaceConfigUpdate,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const spaceFromResponse = httpAppResponse?.data;

        expect(spaceFromResponse).toHaveProperty('id', spaceId);
        expect(spaceFromResponse).toHaveProperty('institutionId', institutionId);
        expect(spaceFromResponse?.createdAt).not.toBeNull();
        expect(spaceFromResponse?.updatedAt).not.toBeNull();
        expect(spaceFromResponse).toHaveProperty('name', 'test-ezpaarse-name-updated');
        expect(spaceFromResponse).toHaveProperty('description', 'ezpaarse space for test institution updated');
        expect(spaceFromResponse).toHaveProperty('initials', spaceConfig.initials);
        expect(spaceFromResponse).toHaveProperty('color', null);
        expect(spaceFromResponse).toHaveProperty('type', spaceConfig.type);
        expect(spaceFromResponse).toHaveProperty('indexPatterns', []);

        // Test service
        const spaceFromService = await spacesService.findByID(spaceId);

        expect(spaceFromService).toHaveProperty('id', spaceId);
        expect(spaceFromService).toHaveProperty('institutionId', institutionId);
        expect(spaceFromService?.createdAt).not.toBeNull();
        expect(spaceFromService?.updatedAt).not.toBeNull();
        expect(spaceFromService).toHaveProperty('name', 'test-ezpaarse-name-updated');
        expect(spaceFromService).toHaveProperty('description', 'ezpaarse space for test institution updated');
        expect(spaceFromService).toHaveProperty('initials', spaceConfig.initials);
        expect(spaceFromService).toHaveProperty('color', null);
        expect(spaceFromService).toHaveProperty('type', spaceConfig.type);
        expect(spaceFromService).toHaveProperty('indexPatterns', []);
      });

      afterAll(async () => {
        await spacesService.deleteAll();
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
    describe(`Update space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      let spaceId;

      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        const space = await spacesService.create({ data: spaceConfig });
        spaceId = space.id;
      });

      it('#02 Should not update space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PATCH',
          url: `/kibana-spaces/${spaceConfig.id}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: spaceConfigUpdate,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Test service
        const spaceFromService = await spacesService.findByID(spaceId);

        expect(spaceFromService).toHaveProperty('id', spaceId);
        expect(spaceFromService).toHaveProperty('institutionId', institutionId);
        expect(spaceFromService?.createdAt).not.toBeNull();
        expect(spaceFromService?.updatedAt).not.toBeNull();
        expect(spaceFromService).toHaveProperty('name', spaceConfig.name);
        expect(spaceFromService).toHaveProperty('description', spaceConfig.description);
        expect(spaceFromService).toHaveProperty('initials', spaceConfig.initials);
        expect(spaceFromService).toHaveProperty('color', null);
        expect(spaceFromService).toHaveProperty('type', spaceConfig.type);
        expect(spaceFromService).toHaveProperty('indexPatterns', []);
      });

      afterAll(async () => {
        await spacesService.deleteAll();
      });
    });
    afterAll(async () => {
      await usersService.deleteAll();
    });
  });
  describe('With random token', () => {
    describe(`Update space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      let spaceId;

      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        const space = await spacesService.create({ data: spaceConfig });
        spaceId = space.id;
      });

      it('#03 Should not update space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PATCH',
          url: `/kibana-spaces/${spaceConfig.id}`,
          data: spaceConfigUpdate,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const spaceFromService = await spacesService.findByID(spaceId);

        expect(spaceFromService).toHaveProperty('id', spaceId);
        expect(spaceFromService).toHaveProperty('institutionId', institutionId);
        expect(spaceFromService?.createdAt).not.toBeNull();
        expect(spaceFromService?.updatedAt).not.toBeNull();
        expect(spaceFromService).toHaveProperty('name', spaceConfig.name);
        expect(spaceFromService).toHaveProperty('description', spaceConfig.description);
        expect(spaceFromService).toHaveProperty('initials', spaceConfig.initials);
        expect(spaceFromService).toHaveProperty('color', null);
        expect(spaceFromService).toHaveProperty('type', spaceConfig.type);
        expect(spaceFromService).toHaveProperty('indexPatterns', []);
      });

      afterAll(async () => {
        await spacesService.deleteAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Update space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      let spaceId;

      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        const space = await spacesService.create({ data: spaceConfig });
        spaceId = space.id;
      });

      it('#04 Should not update space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PATCH',
          url: `/kibana-spaces/${spaceConfig.id}`,
          data: spaceConfigUpdate,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const spaceFromService = await spacesService.findByID(spaceId);

        expect(spaceFromService).toHaveProperty('id', spaceId);
        expect(spaceFromService).toHaveProperty('institutionId', institutionId);
        expect(spaceFromService?.createdAt).not.toBeNull();
        expect(spaceFromService?.updatedAt).not.toBeNull();
        expect(spaceFromService).toHaveProperty('name', spaceConfig.name);
        expect(spaceFromService).toHaveProperty('description', spaceConfig.description);
        expect(spaceFromService).toHaveProperty('initials', spaceConfig.initials);
        expect(spaceFromService).toHaveProperty('color', null);
        expect(spaceFromService).toHaveProperty('type', spaceConfig.type);
        expect(spaceFromService).toHaveProperty('indexPatterns', []);
      });

      afterAll(async () => {
        await spacesService.deleteAll();
      });
    });
  });

  afterAll(async () => {
    await institutionsService.deleteAll();
  });
});
