const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const usersService = require('../../../lib/entities/users.service');
const repositoriesPrisma = require('../../../lib/services/prisma/repositories');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[repositories]: Test read features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const ezpaarseRepositoryConfig = {
    pattern: 'ezpaarse-*',
    type: 'ezPAARSE',
  };

  const ezcounterRepositoryConfig = {
    pattern: 'publisher-*',
    type: 'COUNTER 5',
  };

  const randomRepositoryConfig = {
    pattern: 'random-*',
    type: 'random',
  };
  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      await resetDatabase();
    await resetElastic();
      adminToken = await usersService.generateToken(adminUsername, adminPassword);
    });
    describe(`Get repository of type [${ezcounterRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezcounterRepositoryConfig });
        pattern = repository.pattern;
      });

      it(`#01 Should get repository of type [${ezcounterRepositoryConfig.type}] and pattern [${ezcounterRepositoryConfig.pattern}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/repositories/${pattern}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const repository = httpAppResponse?.data;

        expect(repository?.createdAt).not.toBeNull();
        expect(repository?.updatedAt).not.toBeNull();
        expect(repository).toHaveProperty('pattern', ezcounterRepositoryConfig.pattern);
        expect(repository).toHaveProperty('type', ezcounterRepositoryConfig.type);
      });

      afterAll(async () => {
        await repositoriesPrisma.removeAll();
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
    describe(`Get repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#02 Should not get repository', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/repositories/${pattern}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);
      });

      afterAll(async () => {
        await repositoriesPrisma.removeAll();
      });
    });
    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });
  describe('With random user', () => {
    describe(`Read repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#03 Should not get repository', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/repositories/${pattern}`,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await repositoriesPrisma.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Read repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#04 Should not get repository', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/repositories/${pattern}`,
        });

        expect(httpAppResponse).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await repositoriesPrisma.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
