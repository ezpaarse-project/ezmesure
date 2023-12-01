const ezmesure = require('../../setup/ezmesure');

const repositoriesService = require('../../../lib/entities/repositories.service');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { createRepositoryAsAdmin } = require('../../setup/repositories');
const { resetDatabase } = require('../../../lib/services/prisma/utils');

describe('[repositories]: Test read features', () => {
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
      adminToken = await getAdminToken();
    });
    describe(`Get repository of type [${ezcounterRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezcounterRepositoryConfig });
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
    describe(`Get repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
        await repositoriesService.removeAll();
      });
    });
    afterAll(async () => {
      await usersService.removeAll();
    });
  });
  describe('With random user', () => {
    describe(`Read repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
        await repositoriesService.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Read repository of type [${ezpaarseRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
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
        await repositoriesService.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
  });
});
