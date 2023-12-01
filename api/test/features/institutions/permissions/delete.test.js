const ezmesure = require('../../../setup/ezmesure');

const repositoriesService = require('../../../../lib/entities/repositories.service');
const institutionsService = require('../../../../lib/entities/institutions.service');
const membershipsService = require('../../../../lib/entities/memberships.service');
const usersService = require('../../../../lib/entities/users.service');
const repositoryPermissionsService = require('../../../../lib/entities/repository-permissions.service');

const { getToken, getAdminToken } = require('../../../setup/login');

const { createUserAsAdmin } = require('../../../setup/users');

describe('[repository permission]: Test delete features', () => {
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
          it('#01 Should delete repository permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/institutions/${institutionId}/repositories/${pattern}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 200);

            const repositoryPermissionFromResponse = httpAppResponse?.data;

            expect(repositoryPermissionFromResponse).toHaveProperty('institutionId', institutionId);
            expect(repositoryPermissionFromResponse).toHaveProperty('username', userTest.username);
            expect(repositoryPermissionFromResponse).toHaveProperty('repositoryPattern', pattern);
            expect(repositoryPermissionFromResponse).toHaveProperty('locked', permissionTest.locked);
            expect(repositoryPermissionFromResponse).toHaveProperty('readonly', permissionTest.readonly);

            // Test service
            const repositoryPermissionFromServices = await repositoryPermissionsService
              .findMany({});

            expect(repositoryPermissionFromServices).toEqual([]);
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
});
