const ezmesure = require('../../setup/ezmesure');

const repositoriesService = require('../../../lib/entities/repositories.service');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[repositories]: Test create features', () => {
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
      adminToken = await getAdminToken();
    });

    describe(`Create new repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      it(`#01 Should create repository of type [${ezpaarseRepositoryConfig.type}] and pattern [${ezpaarseRepositoryConfig.pattern}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/repositories',
          data: ezpaarseRepositoryConfig,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 201);
        pattern = httpAppResponse?.data?.pattern;

        const repositoryFromResponse = httpAppResponse?.data;

        expect(repositoryFromResponse?.createdAt).not.toBeNull();
        expect(repositoryFromResponse?.updatedAt).not.toBeNull();
        expect(repositoryFromResponse).toHaveProperty('pattern', ezpaarseRepositoryConfig.pattern);
        expect(repositoryFromResponse).toHaveProperty('type', ezpaarseRepositoryConfig.type);

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
    describe(`Create new repository of type [${ezcounterRepositoryConfig.type}]`, () => {
      let pattern;
      it(`#02 Should create repository of type [${ezcounterRepositoryConfig.type}] and pattern [${ezcounterRepositoryConfig.pattern}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/repositories',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: ezcounterRepositoryConfig,
        });

        pattern = httpAppResponse?.data?.pattern;

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 201);

        const repositoryFromResponse = httpAppResponse?.data;

        expect(repositoryFromResponse?.createdAt).not.toBeNull();
        expect(repositoryFromResponse?.updatedAt).not.toBeNull();
        expect(repositoryFromResponse).toHaveProperty('pattern', ezcounterRepositoryConfig.pattern);
        expect(repositoryFromResponse).toHaveProperty('type', ezcounterRepositoryConfig.type);

        // Test service
        const repositoryFromService = await repositoriesService.findByPattern(pattern);

        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', ezcounterRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', ezcounterRepositoryConfig.type);
      });

      afterAll(async () => {
        await repositoriesService.removeAll();
      });
    });

    describe(`Create new repository of type [${randomRepositoryConfig.type}]`, () => {
      let pattern;
      it(`#03 Should create repositories of type [${randomRepositoryConfig.type}] and pattern  [${randomRepositoryConfig.pattern}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'POST',
          url: '/repositories',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          data: randomRepositoryConfig,
        });

        pattern = httpAppResponse?.data?.pattern;

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 201);

        const repositoryFromResponse = httpAppResponse?.data;

        expect(repositoryFromResponse?.createdAt).not.toBeNull();
        expect(repositoryFromResponse?.updatedAt).not.toBeNull();
        expect(repositoryFromResponse).toHaveProperty('pattern', randomRepositoryConfig.pattern);
        expect(repositoryFromResponse).toHaveProperty('type', randomRepositoryConfig.type);

        // Test service
        const repositoryFromService = await repositoriesService.findByPattern(pattern);

        expect(repositoryFromService?.createdAt).not.toBeNull();
        expect(repositoryFromService?.updatedAt).not.toBeNull();
        expect(repositoryFromService).toHaveProperty('pattern', randomRepositoryConfig.pattern);
        expect(repositoryFromService).toHaveProperty('type', randomRepositoryConfig.type);
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

    describe(`Create new repository of type [${ezcounterRepositoryConfig.type}]`, () => {
      it('#04 Should not create repository', async () => {
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
    describe(`Create new repository of type [${ezcounterRepositoryConfig.type}]`, () => {
      it('#05 Should not create repository', async () => {
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
      await usersService.removeAll();
    });
  });

  describe('With random token', () => {
    describe(`Create new repository of type [${ezcounterRepositoryConfig.type}]`, () => {
      it('#06 Should not create repository', async () => {
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
  });
  describe('Without token', () => {
    describe(`Create new repository of type [${ezcounterRepositoryConfig.type}]`, () => {
      it('#07 Should not create repository', async () => {
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
  });
});
