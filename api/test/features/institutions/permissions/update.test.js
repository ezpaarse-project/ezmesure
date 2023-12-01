const ezmesure = require('../../../setup/ezmesure');

const repositoriesService = require('../../../../lib/entities/repositories.service');
const institutionsService = require('../../../../lib/entities/institutions.service');
const membershipsService = require('../../../../lib/entities/memberships.service');
const usersService = require('../../../../lib/entities/users.service');
const repositoryPermissionsService = require('../../../../lib/entities/repository-permissions.service');

const { getToken, getAdminToken } = require('../../../setup/login');

const { createUserAsAdmin } = require('../../../setup/users');
const { resetDatabase } = require('../../../../lib/services/prisma/utils');

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
    namespace: 'test',
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
      adminToken = await getAdminToken();
    });

    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('with pattern ezpaarse connected to institution', () => {
        let pattern;
        beforeAll(async () => {
          const repository = await repositoriesService.create({ data: ezcounterRepositoryConfig });
          pattern = repository.pattern;
          await repositoriesService.connectInstitution(pattern, institutionId);
        });
        describe('for user user.test', () => {
          beforeAll(async () => {
            await createUserAsAdmin(
              userTest.username,
              userTest.email,
              userTest.fullName,
              userTest.isAdmin,
            );
            membershipUserTest.institutionId = institutionId;
            await membershipsService.create({ data: membershipUserTest });
            permissionTest.username = userTest.username;
            permissionTest.institutionId = institutionId;
            permissionTest.repositoryPattern = pattern;
            await repositoryPermissionsService.create({ data: permissionTest });
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
            const repositoryPermissionFromService = await repositoryPermissionsService
              .findById(institutionId, pattern, userTest.username);

            expect(repositoryPermissionFromService).toHaveProperty('institutionId', institutionId);
            expect(repositoryPermissionFromService).toHaveProperty('username', userTest.username);
            expect(repositoryPermissionFromService).toHaveProperty('repositoryPattern', pattern);
            expect(repositoryPermissionFromService).toHaveProperty('locked', permissionUpdateTest.locked);
            expect(repositoryPermissionFromService).toHaveProperty('readonly', permissionUpdateTest.readonly);
          });
          afterAll(async () => {
            await repositoryPermissionsService.removeAll();
            await usersService.removeAll();
            await membershipsService.removeAll();
          });
        });
        afterAll(async () => {
          await repositoriesService.removeAll();
        });
      });
      afterAll(async () => {
        await institutionsService.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
  });
});
