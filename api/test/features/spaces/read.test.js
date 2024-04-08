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

describe('[space]: Test read spaces features', () => {
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
    adminToken = await (new UsersService()).generateToken(adminUsername, adminPassword);
    const institution = await institutionsPrisma.create({ data: institutionTest });
    institutionId = institution.id;
    spaceConfig.institutionId = institutionId;
  });

  describe('As admin', () => {
    describe(`Get space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        await spacesPrisma.create({ data: spaceConfig });
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
        await spacesPrisma.removeAll();
      });
    });
  });
  describe('As user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await (new UsersService()).generateToken(userTest.username, userTest.password);
    });

    describe(`Get space [${spaceConfig.type}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        spaceConfig.institutionId = institutionId;
        await spacesPrisma.create({ data: spaceConfig });
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
        await spacesPrisma.removeAll();
      });
    });
    afterAll(async () => {
      await usersPrisma.removeAll();
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
        await spacesPrisma.removeAll();
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
        await spacesPrisma.removeAll();
      });
    });
  });

  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
