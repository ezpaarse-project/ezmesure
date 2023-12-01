const ezmesure = require('../../setup/ezmesure');

const repositoriesService = require('../../../lib/entities/repositories.service');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[repositories]: Test update features', () => {
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
      adminToken = await getAdminToken();
    });
    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
        const repositoryFromService = await repositoriesService
          .findByPattern(updateRepositoryConfig.pattern);

        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', updateRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', updateRepositoryConfig.type);
      });

      afterAll(async () => {
        await repositoriesService.removeAll();
      });
    });
  });
  describe('As user', () => {
    let userToken;
    let userTest;
    beforeAll(async () => {
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });

    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
  describe('With random token', () => {
    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
  describe('Without token', () => {
    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
});
