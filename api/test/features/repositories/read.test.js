const ezmesure = require('../../setup/ezmesure');

const repositoriesService = require('../../../lib/entities/repositories.service');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const {
  createInstitution,
} = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { createRepositoryAsAdmin } = require('../../setup/repositories');

describe('[repositories]: Test read features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  const ezpaarseRepositoryConfig = {
    type: 'ezPAARSE',
    pattern: 'ezpaarse-*',
  };

  const ezcounterRepositoryConfig = {
    type: 'COUNTER 5',
    pattern: 'publisher-*',
  };

  const randomRepositoryConfig = {
    type: 'random',
    pattern: 'random-*',
  };
  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      adminToken = await getAdminToken();
    });
    describe('Institution created by admin', () => {
      let institutionId;

      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe(`Get repository of type [${ezcounterRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;
        let repositoryConfig;

        beforeAll(async () => {
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it(`Should get repository of type [${ezcounterRepositoryConfig.type}] and pattern [${ezcounterRepositoryConfig.pattern}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          const repository = httpAppResponse?.data;
          expect(repository?.id).not.toBeNull();
          expect(repository).toHaveProperty('institutionId', institutionId);
          expect(repository?.createdAt).not.toBeNull();
          expect(repository?.updatedAt).not.toBeNull();
          expect(repository).toHaveProperty('pattern', repositoryConfig.pattern);
          expect(repository).toHaveProperty('type', repositoryConfig.type);
        });

        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });

      describe(`Get repository of type [${randomRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryConfig;
        let repositoryId;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'random',
            institutionId,
            pattern: 'random-*',
          };
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('#01 Should get repository of type [random] and pattern [random-*]', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          const repository = httpAppResponse?.data;
          expect(repository?.id).not.toBeNull();
          expect(repository).toHaveProperty('institutionId', institutionId);
          expect(repository?.createdAt).not.toBeNull();
          expect(repository?.updatedAt).not.toBeNull();
          expect(repository).toHaveProperty('pattern', repositoryConfig.pattern);
          expect(repository).toHaveProperty('type', repositoryConfig.type);
        });

        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      afterAll(async () => {
        await institutionsService.deleteAll();
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
    describe('Institution created by user', () => {
      beforeAll(async () => {
        await createInstitution(institutionTest, userTest);
      });
      describe(`Get repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it('#02 Should get HTTP status 403', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);
        });

        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });

    describe('Institution created by admin', () => {
      beforeAll(async () => {
        await institutionsService.create({ data: institutionTest });
      });
      describe(`Get repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it('#03 Should get HTTP status 403', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);
        });

        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });
    afterAll(async () => {
      await usersService.deleteAll();
    });
  });
  describe('With random user', () => {
    beforeAll(async () => {
      await institutionsService.create({ data: institutionTest });
    });
    describe(`Read repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
      let repositoryId;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
        repositoryId = repository.id;
      });

      it('#04 Should get HTTP status 401', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/repositories/${repositoryId}`,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await repositoriesService.deleteAll();
      });
    });
    afterAll(async () => {
      await institutionsService.deleteAll();
    });
  });
  describe('Without token', () => {
    beforeAll(async () => {
      await institutionsService.create({ data: institutionTest });
    });

    describe(`Read repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
      let repositoryId;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
        repositoryId = repository.id;
      });

      it('#05 Should get HTTP status 401', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/repositories/${repositoryId}`,
        });

        expect(httpAppResponse).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await repositoriesService.deleteAll();
      });
    });
    afterAll(async () => {
      await institutionsService.deleteAll();
    });
  });
});
