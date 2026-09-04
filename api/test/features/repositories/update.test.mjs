import {
  describe, it, expect, beforeAll, afterAll,
} from 'vitest';
import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';
import { signJWT } from '../../../lib/utils/jwt';

import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';
import repositoriesPrisma from '../../../lib/services/prisma/repositories';

const adminUsername = config.get('admin.username');

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

  const updateRepositoryConfig = {
    pattern: 'update-pattern',
    type: 'update-type',
  };
  describe('As admin', () => {
    let adminToken;

    beforeAll(async () => {
      await resetDatabase();
      await resetElastic();
      adminToken = await signJWT({ username: adminUsername });
    });
    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it(`#01 Should Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}] and pattern [${ezpaarseRepositoryConfig.pattern}] with [${updateRepositoryConfig.pattern}]`, async () => {
        const res = await ezmesure.raw(`/repositories/${pattern}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: updateRepositoryConfig,
        });

        // Test API
        expect(res).toHaveProperty('status', 200);

        const { _data: repository } = res;

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
      userToken = await signJWT({ username: userTest.username });
    });

    describe(`Update repository of type [${ezpaarseRepositoryConfig.type}] with [${updateRepositoryConfig.type}]`, () => {
      let pattern;

      beforeAll(async () => {
        const repository = await repositoriesPrisma.create({ data: ezpaarseRepositoryConfig });
        pattern = repository.pattern;
      });

      it('#02 Should not update repository', async () => {
        const res = await ezmesure.raw(`/repositories/${pattern}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          body: updateRepositoryConfig,
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
        const res = await ezmesure.raw(`/repositories/${pattern}`, {
          method: 'PATCH',
          body: updateRepositoryConfig,
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
        const res = await ezmesure.raw(`/repositories/${pattern}`, {
          method: 'PATCH',
          body: updateRepositoryConfig,
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
