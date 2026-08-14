import {
  describe, it, expect, beforeAll, afterAll,
} from 'vitest';
import config from 'config';

import ezmesure from '../../../setup/ezmesure';

import { resetDatabase } from '../../../../lib/services/prisma/utils';
import { resetElastic } from '../../../../lib/services/elastic/utils';
import { signJWT } from '../../../../lib/utils/jwt';

import repositoriesPrisma from '../../../../lib/services/prisma/repositories';
import institutionsPrisma from '../../../../lib/services/prisma/institutions';
import membershipsPrisma from '../../../../lib/services/prisma/memberships';
import usersPrisma from '../../../../lib/services/prisma/users';
import usersElastic from '../../../../lib/services/elastic/users';

import repositoryPermissionsPrisma from '../../../../lib/services/prisma/repository-permissions';

const adminUsername = config.get('admin.username');

describe('[repository permission]: Test create features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const membershipUserTest = {
    username: userTest.username,
  };

  const institutionTest = {
    name: 'Test',
  };

  const ezcounterRepositoryConfig = {
    pattern: 'publisher-*',
    type: 'COUNTER 5',
  };

  const permissionTest = {
    readonly: true,
    locked: true,
  };

  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      await resetDatabase();
      await resetElastic();
      adminToken = await signJWT({ username: adminUsername });
    });

    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsPrisma.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('with pattern ezpaarse connected to institution', () => {
        let pattern;
        beforeAll(async () => {
          const repository = await repositoriesPrisma.create({ data: ezcounterRepositoryConfig });
          pattern = repository.pattern;
          await repositoriesPrisma.connectInstitution(pattern, institutionId);
        });
        describe(`for user [${userTest.username}]`, () => {
          beforeAll(async () => {
            await usersPrisma.create({ data: userTest });
            await usersElastic.createUser(userTest);
            membershipUserTest.institutionId = institutionId;
            await membershipsPrisma.create({ data: membershipUserTest });
          });
          it('#01 Should create repository permission', async () => {
            const httpAppResponse = await ezmesure.raw(`/institutions/${institutionId}/repositories/${pattern}/permissions/${userTest.username}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              body: permissionTest,
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 200);

            const { _data: repositoryPermissionFromResponse } = httpAppResponse;

            expect(repositoryPermissionFromResponse).toHaveProperty('institutionId', institutionId);
            expect(repositoryPermissionFromResponse).toHaveProperty('username', userTest.username);
            expect(repositoryPermissionFromResponse).toHaveProperty('repositoryPattern', pattern);
            expect(repositoryPermissionFromResponse).toHaveProperty('locked', permissionTest.locked);
            expect(repositoryPermissionFromResponse).toHaveProperty('readonly', permissionTest.readonly);

            // Test service
            const repositoryPermissionFromService = await repositoryPermissionsPrisma
              .findById(institutionId, pattern, userTest.username);

            expect(repositoryPermissionFromService).toHaveProperty('institutionId', institutionId);
            expect(repositoryPermissionFromService).toHaveProperty('username', userTest.username);
            expect(repositoryPermissionFromService).toHaveProperty('repositoryPattern', pattern);
            expect(repositoryPermissionFromService).toHaveProperty('locked', permissionTest.locked);
            expect(repositoryPermissionFromService).toHaveProperty('readonly', permissionTest.readonly);
          });
          afterAll(async () => {
            await repositoryPermissionsPrisma.removeAll();
            await membershipsPrisma.removeAll();
            await usersPrisma.removeAll();
          });
        });
        afterAll(async () => {
          await repositoriesPrisma.removeAll();
        });
      });
      afterAll(async () => {
        await institutionsPrisma.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
