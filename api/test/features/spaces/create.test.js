const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const spacesPrisma = require('../../../lib/services/prisma/spaces');
const institutionsPrisma = require('../../../lib/services/prisma/institutions');
const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const usersService = require('../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[space]: Test create spaces features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

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
  };

  let institutionId;

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await usersService.generateToken(adminUsername, adminPassword);
    const institution = await institutionsPrisma.create({ data: institutionTest });
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
        const spaceFromService = await spacesPrisma.findByID(spaceId);

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
        await spacesPrisma.removeAll();
      });
    });
  });
  describe('As user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await usersService.generateToken(userTest.username, userTest.password);
    });
    describe(`Create new space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
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
        const spaceFromService = await spacesPrisma.findMany();
        expect(spaceFromService).toEqual([]);
      });
    });
    afterAll(async () => {
      await spacesPrisma.removeAll();
      await usersPrisma.removeAll();
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
        const spaceFromService = await spacesPrisma.findMany();
        expect(spaceFromService).toEqual([]);
      });

      afterAll(async () => {
        await spacesPrisma.removeAll();
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
        const spaceFromService = await spacesPrisma.findMany();
        expect(spaceFromService).toEqual([]);
      });

      afterAll(async () => {
        await spacesPrisma.removeAll();
      });
    });
  });

  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
