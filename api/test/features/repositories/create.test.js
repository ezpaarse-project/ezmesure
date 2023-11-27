const ezmesure = require('../../setup/ezmesure');

const repositoriesService = require('../../../lib/entities/repositories.service');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const {
  createInstitution,
} = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[repositories]: Test create features', () => {
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

      describe(`Create new repository of type [${ezpaarseRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;

        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
        });

        it(`#01 Should create repository of type [${ezpaarseRepositoryConfig.type}] and pattern [${ezpaarseRepositoryConfig.pattern}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/repositories',
            data: ezpaarseRepositoryConfig,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          repositoryId = httpAppResponse?.data?.id;

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 201);

          const repositoryFromResponse = httpAppResponse?.data;

          expect(repositoryFromResponse).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromResponse?.createdAt).not.toBeNull();
          expect(repositoryFromResponse?.updatedAt).not.toBeNull();
          expect(repositoryFromResponse).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
          expect(repositoryFromResponse).toHaveProperty('type', ezpaarseRepositoryConfig.type);

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

      describe(`Create new repository of type [${ezcounterRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;
        beforeAll(() => {
          ezcounterRepositoryConfig.institutionId = institutionId;
        });

        it(`#02 Should create repository of type [${ezcounterRepositoryConfig.type}] and pattern [${ezcounterRepositoryConfig.pattern}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/repositories',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: ezcounterRepositoryConfig,
          });

          repositoryId = httpAppResponse?.data?.id;

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 201);

          const repositoryFromResponse = httpAppResponse?.data;

          expect(repositoryFromResponse).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromResponse?.createdAt).not.toBeNull();
          expect(repositoryFromResponse?.updatedAt).not.toBeNull();
          expect(repositoryFromResponse).toHaveProperty('pattern', ezcounterRepositoryConfig.pattern);
          expect(repositoryFromResponse).toHaveProperty('type', ezcounterRepositoryConfig.type);

          // Test service
          const repositoryFromService = await repositoriesService.findByID(repositoryId);

          expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromService?.createdAt).not.toBeNull();
          expect(repositoryFromService?.updatedAt).not.toBeNull();
          expect(repositoryFromService).toHaveProperty('pattern', ezcounterRepositoryConfig.pattern);
          expect(repositoryFromService).toHaveProperty('type', ezcounterRepositoryConfig.type);
        });

        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });

      describe(`Create new repository of type [${randomRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        let repositoryId;
        beforeAll(async () => {
          randomRepositoryConfig.institutionId = institutionId;
        });

        it(`#03 Should create repositories of type [${randomRepositoryConfig.type}] and pattern  [${randomRepositoryConfig.pattern}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/repositories',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: randomRepositoryConfig,
          });

          repositoryId = httpAppResponse?.data?.id;

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 201);

          const repositoryFromResponse = httpAppResponse?.data;

          expect(repositoryFromResponse?.id).not.toBeNull();
          expect(repositoryFromResponse).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromResponse?.createdAt).not.toBeNull();
          expect(repositoryFromResponse?.updatedAt).not.toBeNull();
          expect(repositoryFromResponse).toHaveProperty('pattern', randomRepositoryConfig.pattern);
          expect(repositoryFromResponse).toHaveProperty('type', randomRepositoryConfig.type);

          // Test service
          const repositoryFromService = await repositoriesService.findByID(repositoryId);

          expect(repositoryFromService).toHaveProperty('institutionId', institutionId);
          expect(repositoryFromService?.createdAt).not.toBeNull();
          expect(repositoryFromService?.updatedAt).not.toBeNull();
          expect(repositoryFromService).toHaveProperty('pattern', randomRepositoryConfig.pattern);
          expect(repositoryFromService).toHaveProperty('type', randomRepositoryConfig.type);
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

    describe('Institution created by admin', () => {
      let institutionId;

      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });
      describe(`Create new repository of type [${ezcounterRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        beforeAll(() => {
          ezcounterRepositoryConfig.institutionId = institutionId;
        });

        it('#04 Should get HTTP status 403', async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/repositories',
            data: ezcounterRepositoryConfig,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);

          // Test service
          const repositoryFromService = await repositoriesService.findMany();
          expect(repositoryFromService).toEqual([]);
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
      describe(`Create new repository of type [${ezcounterRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
        beforeAll(() => {
          ezcounterRepositoryConfig.institutionId = institutionId;
        });

        it('#05 Should get HTTP status 403', async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/repositories',
            data: ezcounterRepositoryConfig,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);

          // Test service
          const repositoryFromService = await repositoriesService.findMany();
          expect(repositoryFromService).toEqual([]);
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

    describe(`Create new repository of type [${ezcounterRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
      beforeAll(() => {
        ezcounterRepositoryConfig.institutionId = institutionId;
      });

      it('#06 Should get HTTP status 401', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/repositories',
          data: ezcounterRepositoryConfig,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const repositoryFromService = await repositoriesService.findMany();
        expect(repositoryFromService).toEqual([]);
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
    describe(`Create new repository of type [${ezcounterRepositoryConfig.type}] for [${institutionTest.name}] institution`, () => {
      beforeAll(() => {
        ezcounterRepositoryConfig.institutionId = institutionId;
      });

      it('#07 Should get HTTP status 401', async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/repositories',
          data: ezcounterRepositoryConfig,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

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
