const ezmesure = require('../../setup/ezmesure');

const spacesService = require('../../../lib/entities/spaces.service');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[space]: Test read spaces features', () => {
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
  let adminToken;
  let institutionId;
  beforeAll(async () => {
    adminToken = await getAdminToken();
    const institution = await institutionsService.create({ data: institutionTest });
    institutionId = institution.id;
    spaceConfig.institutionId = institutionId;
  });

  describe('As admin', () => {
    describe(`Get space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        await spacesService.create({ data: spaceConfig });
      });

      it('#01 Should get space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/kibana-spaces/${spaceConfig.id}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        expect(httpAppResponse).toHaveProperty('status', 200);

        const space = httpAppResponse?.data;

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

    describe(`Get space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        await spacesService.create({ data: spaceConfig });
      });

      it('#02 Should not get space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/kibana-spaces/${spaceConfig.id}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        expect(httpAppResponse).toHaveProperty('status', 403);
      });

      afterAll(async () => {
        await spacesService.removeAll();
      });
    });
    afterAll(async () => {
      await usersService.removeAll();
    });
  });
  describe('With random token', () => {
    describe(`Get space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
      });

      it('#03 Should not get space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/kibana-spaces/${spaceConfig.id}`,
          headers: {
            Authorization: 'Bearer: random',
          },
        });
        expect(httpAppResponse).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await spacesService.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Get space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
      });

      it('#04 Should not get space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/kibana-spaces/${spaceConfig.id}`,
        });
        expect(httpAppResponse).toHaveProperty('status', 401);
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
