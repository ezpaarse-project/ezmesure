const ezmesure = require('../../setup/ezmesure');

const repositoriesService = require('../../../lib/entities/repositories.service');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createInstitution } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[repositories]: Test update features', () => {
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

  const updateRepositoryConfig = {
    type: 'update-type',
    pattern: 'update-pattern',
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
      describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it(`#01 Should Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}] and pattern [${ezpaarseRepositoryConfig.pattern}]`, async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: updateRepositoryConfig,
          });

          // Test API
          expect(res).toHaveProperty('status', 200);

          const repository = res?.data;

          expect(repository?.id).not.toBeNull();
          expect(repository).toHaveProperty('institutionId', institutionId);
          expect(repository?.createdAt).not.toBeNull();
          expect(repository?.updatedAt).not.toBeNull();
          expect(repository).toHaveProperty('pattern', updateRepositoryConfig?.pattern);
          expect(repository).toHaveProperty('type', updateRepositoryConfig?.type);

          // Test service
          const repositoryFromService = await repositoriesService.findByID(repositoryId);

          expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromService?.createdAt).not.toBeNull();
          expect(repositoryFromService?.updatedAt).not.toBeNull();
          expect(repositoryFromService).toHaveProperty('pattern', updateRepositoryConfig.pattern);
          expect(repositoryFromService).toHaveProperty('type', updateRepositoryConfig.type);
        });

        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });

      describe(`Update repository of type [${ezcounterRepositoryConfig.type}] with [${updateRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it(`#02 Should Update repository of type [${ezcounterRepositoryConfig.type}] with [${updateRepositoryConfig.type}] and pattern [${ezcounterRepositoryConfig.pattern}]`, async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: updateRepositoryConfig,
          });

          // Test API
          expect(res).toHaveProperty('status', 200);

          const repository = res?.data;

          expect(repository?.id).not.toBeNull();
          expect(repository).toHaveProperty('institutionId', institutionId);
          expect(repository?.createdAt).not.toBeNull();
          expect(repository?.updatedAt).not.toBeNull();
          expect(repository).toHaveProperty('pattern', updateRepositoryConfig?.pattern);
          expect(repository).toHaveProperty('type', updateRepositoryConfig?.type);

          // Test service
          const repositoryFromService = await repositoriesService.findByID(repositoryId);

          expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromService?.createdAt).not.toBeNull();
          expect(repositoryFromService?.updatedAt).not.toBeNull();
          expect(repositoryFromService).toHaveProperty('pattern', updateRepositoryConfig.pattern);
          expect(repositoryFromService).toHaveProperty('type', updateRepositoryConfig.type);
        });

        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });

      describe(`Update repository of type [${randomRepositoryConfig.pattern}] with [${updateRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it(`#03 Should Update repository of type [${randomRepositoryConfig.pattern}] with [${updateRepositoryConfig.type}] and pattern [${randomRepositoryConfig.type}]`, async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: updateRepositoryConfig,
          });

          // Test API
          expect(res).toHaveProperty('status', 200);

          const repository = res?.data;

          expect(repository?.id).not.toBeNull();
          expect(repository).toHaveProperty('institutionId', institutionId);
          expect(repository?.createdAt).not.toBeNull();
          expect(repository?.updatedAt).not.toBeNull();
          expect(repository).toHaveProperty('pattern', updateRepositoryConfig?.pattern);
          expect(repository).toHaveProperty('type', updateRepositoryConfig?.type);

          // Test service
          const repositoryFromService = await repositoriesService.findByID(repositoryId);

          expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromService?.createdAt).not.toBeNull();
          expect(repositoryFromService?.updatedAt).not.toBeNull();
          expect(repositoryFromService).toHaveProperty('pattern', updateRepositoryConfig.pattern);
          expect(repositoryFromService).toHaveProperty('type', updateRepositoryConfig.type);
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
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);
      });

      describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it('#04 Should not update repository', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: updateRepositoryConfig,
          });

          // Test API
          expect(res).toHaveProperty('status', 403);

          // Test service
          const repositoryFromService = await repositoriesService.findByID(repositoryId);

          expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromService?.createdAt).not.toBeNull();
          expect(repositoryFromService?.updatedAt).not.toBeNull();
          expect(repositoryFromService).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
          expect(repositoryFromService).toHaveProperty('type', ezpaarseRepositoryConfig.type);
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
      let institutionId;

      beforeAll(async () => {
        ezpaarseRepositoryConfig.institutionId = institutionId;
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it('#05 Should not update repository', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: updateRepositoryConfig,
          });

          // Test API
          expect(res).toHaveProperty('status', 403);

          // Test service
          const repositoryFromService = await repositoriesService.findByID(repositoryId);

          expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromService?.createdAt).not.toBeNull();
          expect(repositoryFromService?.updatedAt).not.toBeNull();
          expect(repositoryFromService).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
          expect(repositoryFromService).toHaveProperty('type', ezpaarseRepositoryConfig.type);
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
  describe('With random token', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
      let repositoryId;

      beforeAll(async () => {
        ezpaarseRepositoryConfig.institutionId = institutionId;
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
        repositoryId = repository.id;
      });

      it('#06 Should not update repository', async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/repositories/${repositoryId}`,
          data: updateRepositoryConfig,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(res).toHaveProperty('status', 401);

        // Test service
        const repositoryFromService = await repositoriesService.findByID(repositoryId);

        expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', ezpaarseRepositoryConfig.type);
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
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
      let repositoryId;

      beforeAll(async () => {
        ezpaarseRepositoryConfig.institutionId = institutionId;
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
        repositoryId = repository.id;
      });

      it('#07 Should not update repository', async () => {
        const res = await ezmesure({
          method: 'PATCH',
          url: `/repositories/${repositoryId}`,
          data: updateRepositoryConfig,
        });

        // Test API
        expect(res).toHaveProperty('status', 401);

        // Test service
        const repositoryFromService = await repositoriesService.findByID(repositoryId);

        expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', ezpaarseRepositoryConfig.type);
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
