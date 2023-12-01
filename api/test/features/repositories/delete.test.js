const ezmesure = require('../../setup/ezmesure');

const usersService = require('../../../lib/entities/users.service');
const repositoriesService = require('../../../lib/entities/repositories.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { resetDatabase } = require('../../../lib/services/prisma/utils');

describe('[repositories]: Test delete features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  const ezpaarseRepositoryConfig = {
    type: 'ezPAARSE',
    pattern: 'ezpaarse-*',
  };

  describe('As admin', () => {
    let adminToken;

    beforeAll(async () => {
      await resetDatabase();
      adminToken = await getAdminToken();
    });

    describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;
      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
        const repositoryFromService = await repositoriesService.findMany();
        expect(repositoryFromService).toEqual([]);
      });

      afterAll(async () => {
        await repositoriesService.removeAll();
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

    describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
        const repositoryFromService = await repositoriesService.findByPattern(pattern);

        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', ezpaarseRepositoryConfig.type);
      });

      afterAll(async () => {
        await repositoriesService.removeAll();
      });
    });

    afterAll(async () => {
      await usersService.removeAll();
    });
  });
  describe('Without token', () => {
    describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
        const repositoryFromService = await repositoriesService.findByPattern(pattern);

        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', ezpaarseRepositoryConfig.type);
      });

      afterAll(async () => {
        await repositoriesService.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
  });
});
