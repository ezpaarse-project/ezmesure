import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import config from 'config';

import ezmesure from '../../../setup/ezmesure';

import { resetDatabase } from '../../../../lib/services/prisma/utils';
import { resetElastic } from '../../../../lib/services/elastic/utils';

import repositoriesPrisma from '../../../../lib/services/prisma/repositories';
import institutionsPrisma from '../../../../lib/services/prisma/institutions';
import membershipsPrisma from '../../../../lib/services/prisma/memberships';
import usersPrisma from '../../../../lib/services/prisma/users';
import usersElastic from '../../../../lib/services/elastic/users';
import UsersService from '../../../../lib/entities/users.service';
import repositoryPermissionsPrisma from '../../../../lib/services/prisma/repository-permissions';

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[repository permission]: Test update features', () => {
  const allPermission = ['memberships:write', 'memberships:read'];
  const readPermission = ['memberships:read'];
  const emptyPermission = [];

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

  const permissionTest = {
    readonly: true,
    locked: true,
  };

  const permissionUpdateTest = {
    readonly: false,
    locked: false,
  };

  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      await resetDatabase();
      await resetElastic();
      adminToken = await (new UsersService()).generateToken(adminUsername, adminPassword);
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
            permissionTest.username = userTest.username;
            permissionTest.institutionId = institutionId;
            permissionTest.repositoryPattern = pattern;
            await repositoryPermissionsPrisma.create({ data: permissionTest });
          });
          it('#01 Should update repository permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'PUT',
              url: `/institutions/${institutionId}/repositories/${pattern}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: permissionUpdateTest,
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 200);

            const repositoryPermissionFromResponse = httpAppResponse?.data;

            expect(repositoryPermissionFromResponse).toHaveProperty('institutionId', institutionId);
            expect(repositoryPermissionFromResponse).toHaveProperty('username', userTest.username);
            expect(repositoryPermissionFromResponse).toHaveProperty('repositoryPattern', pattern);
            expect(repositoryPermissionFromResponse).toHaveProperty('locked', permissionUpdateTest.locked);
            expect(repositoryPermissionFromResponse).toHaveProperty('readonly', permissionUpdateTest.readonly);

            // Test service
            const repositoryPermissionFromService = await repositoryPermissionsPrisma
              .findById(institutionId, pattern, userTest.username);

            expect(repositoryPermissionFromService).toHaveProperty('institutionId', institutionId);
            expect(repositoryPermissionFromService).toHaveProperty('username', userTest.username);
            expect(repositoryPermissionFromService).toHaveProperty('repositoryPattern', pattern);
            expect(repositoryPermissionFromService).toHaveProperty('locked', permissionUpdateTest.locked);
            expect(repositoryPermissionFromService).toHaveProperty('readonly', permissionUpdateTest.readonly);
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
