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

describe('[repositories]: Test delete features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const institutionTest = {
    name: 'Test',
  };

  const ezpaarseRepositoryConfig = {
    type: 'ezPAARSE',
    pattern: 'ezpaarse-*',
  };

  describe('As admin', () => {
    let adminToken;

    beforeAll(async () => {
      await resetDatabase();
    await resetElastic();
      adminToken = await usersService.generateToken(adminUsername, adminPassword);
    });

    describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;
      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });
      it(`#01 Should delete repository of type [${ezpaarseRepositoryConfig.type}] and pattern [${ezpaarseRepositoryConfig.pattern}]`, async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/repositories/${pattern}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(res).toHaveProperty('status', 204);

        // Test service
        const repositoryFromService = await repositoriesPrisma.findMany();
        expect(repositoryFromService).toEqual([]);
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

    describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#02 Should not delete repository', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/repositories/${pattern}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(res).toHaveProperty('status', 403);

        // Test service
        const repositoryFromService = await repositoriesPrisma.findByPattern(pattern);

        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', ezpaarseRepositoryConfig.type);
      });

      afterAll(async () => {
        await repositoriesPrisma.removeAll();
      });
    });

    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });
  describe('Without token', () => {
    describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#03 Should not delete repository', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/repositories/${pattern}`,
        });

        // Test API
        expect(res).toHaveProperty('status', 401);

        // Test service
        const repositoryFromService = await repositoriesPrisma.findByPattern(pattern);

        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', ezpaarseRepositoryConfig.type);
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
