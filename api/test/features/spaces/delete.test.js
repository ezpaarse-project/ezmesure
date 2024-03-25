const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const spacesPrisma = require('../../../lib/services/prisma/spaces');
const institutionsPrisma = require('../../../lib/services/prisma/institutions');
const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const UsersService = require('../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[space]: Test delete spaces features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

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

  let adminToken;
  let institutionId;

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await UsersService.generateToken(adminUsername, adminPassword);
    const institution = await institutionsPrisma.create({ data: institutionTest });
    institutionId = institution.id;
  });

  describe('As admin', () => {
    describe(`Delete space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        await spacesPrisma.create({ data: spaceConfig });
      });

      it('#01 Should delete space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/kibana-spaces/${spaceConfig.id}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        // Test API
        expect(httpAppResponse).toHaveProperty('status', 204);

        // Test service
        const spaceFromService = await spacesPrisma.findMany();
        expect(spaceFromService).toEqual([]);
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
      userToken = await UsersService.generateToken(userTest.username, userTest.password);
    });

    describe(`Delete space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      let spaceId;

      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        const space = await spacesPrisma.create({ data: spaceConfig });
        spaceId = space.id;
      });

      it('#02 Should not delete space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/kibana-spaces/${spaceConfig.id}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

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
    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });
  describe('With random token', () => {
    describe(`Delete space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      let spaceId;

      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        const space = await spacesPrisma.create({ data: spaceConfig });
        spaceId = space.id;
      });

      it('#03 Should not delete space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/kibana-spaces/${spaceConfig.id}`,
          headers: {
            Authorization: 'Bearer: random',
          },
        });
        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

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
  describe('Without token', () => {
    describe(`Delete space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      let spaceId;

      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        const space = await spacesPrisma.create({ data: spaceConfig });
        spaceId = space.id;
      });

      it('#04 Should not delete space', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/kibana-spaces/${spaceConfig.id}`,
        });
        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

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

  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
