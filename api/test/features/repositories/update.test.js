const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const UsersService = require('../../../lib/entities/users.service');
const repositoriesPrisma = require('../../../lib/services/prisma/repositories');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[repositories]: Test update features', () => {
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

  const updateRepositoryConfig = {
    pattern: 'update-pattern',
    type: 'update-type',
  };
  describe('As admin', () => {
    let adminToken;

    beforeAll(async () => {
      await resetDatabase();
      await resetElastic();
      adminToken = await UsersService.generateToken(adminUsername, adminPassword);
    });
    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it(`#01 Should Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}] and pattern [${ezpaarseRepositoryConfig.pattern}] with [${updateRepositoryConfig.pattern}]`, async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/repositories/${pattern}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: updateRepositoryConfig,
        });

        // Test API
        expect(res).toHaveProperty('status', 200);

        const repository = res?.data;

        expect(repository?.createdAt).not.toBeNull();
        expect(repository?.updatedAt).not.toBeNull();
        expect(repository).toHaveProperty('pattern', updateRepositoryConfig?.pattern);
        expect(repository).toHaveProperty('type', updateRepositoryConfig?.type);

        // Test service
        const repositoryFromService = await repositoriesPrisma
          .findByPattern(updateRepositoryConfig.pattern);

        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', updateRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', updateRepositoryConfig.type);
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
      userToken = await UsersService.generateToken(userTest.username, userTest.password);
    });

    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#02 Should not update repository', async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/repositories/${pattern}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: updateRepositoryConfig,
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
  describe('With random token', () => {
    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#03 Should not update repository', async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/repositories/${pattern}`,
          data: updateRepositoryConfig,
          headers: {
            Authorization: 'Bearer: random',
          },
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
  describe('Without token', () => {
    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#04 Should not update repository', async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/repositories/${pattern}`,
          data: updateRepositoryConfig,
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
