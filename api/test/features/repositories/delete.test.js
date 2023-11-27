const ezmesure = require('../../setup/ezmesure');

const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');
const repositoriesService = require('../../../lib/entities/repositories.service');

const { createInstitution } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

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
      adminToken = await getAdminToken();
    });

    describe('Institution created by admin', () => {
      let institutionId;

      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;
        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });
        it(`#01 Should delete repository of type [${ezpaarseRepositoryConfig.type}] and pattern [${ezpaarseRepositoryConfig.pattern}]`, async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/repositories/${repositoryId}`,
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
      });
      afterAll(async () => {
        await institutionsService.deleteAll();
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

    describe('Institution created by admin', () => {
      let institutionId;

      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it('#02 Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
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
      });
      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });
    describe('Institution created by user', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);
      });

      describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        it('#03 Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
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

    describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
      let repositoryId;

      beforeAll(async () => {
        ezpaarseRepositoryConfig.institutionId = institutionId;
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
        repositoryId = repository.id;
      });

      it('#04 Should get HTTP status 401', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/repositories/${repositoryId}`,
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

    describe(`Delete repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
      let repositoryId;

      beforeAll(async () => {
        ezpaarseRepositoryConfig.institutionId = institutionId;
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
        repositoryId = repository.id;
      });

      it('#05 Should get HTTP status 401', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/repositories/${repositoryId}`,
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
    });

    afterAll(async () => {
      await institutionsService.deleteAll();
    });
  });
});
