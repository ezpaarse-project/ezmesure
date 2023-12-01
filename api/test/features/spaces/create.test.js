const ezmesure = require('../../setup/ezmesure');

const spacesService = require('../../../lib/entities/spaces.service');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
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

  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  let institutionId;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const institution = await institutionsService.create({ data: institutionTest });
    institutionId = institution.id;
    spaceConfig.institutionId = institutionId;
  });

  describe('As admin', () => {
    describe(`Create new space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      let spaceId;
      it('#01 Should create space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/kibana-spaces/',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: spaceConfig,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 201);

        spaceId = httpAppResponse?.data?.id;

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
        await spacesService.removeAll();
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
    describe(`Create new space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        userTest = await createDefaultActivatedUserAsAdmin();
        userToken = await getToken(userTest.username, userTest.password);
      });

      it('#02 Should not create space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/kibana-spaces/',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: spaceConfig,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Test service
        const spaceFromService = await spacesService.findMany();
        expect(spaceFromService).toEqual([]);
      });
    });
    afterAll(async () => {
      await spacesService.removeAll();
      await usersService.removeAll();
    });
  });
  describe('With random token', () => {
    describe(`Create new space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
      });

      it('#03 Should not create space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/kibana-spaces/',
          data: spaceConfig,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const spaceFromService = await spacesService.findMany();
        expect(spaceFromService).toEqual([]);
      });

      afterAll(async () => {
        await spacesService.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Create new space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
      });

      it('#04 Should not create space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/kibana-spaces/',
          data: spaceConfig,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const spaceFromService = await spacesService.findMany();
        expect(spaceFromService).toEqual([]);
      });

      afterAll(async () => {
        await spacesService.removeAll();
      });
    });
  });

  afterAll(async () => {
    await institutionsService.removeAll();
  });
});
