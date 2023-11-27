const ezmesure = require('../../../setup/ezmesure');

const repositoriesService = require('../../../../lib/entities/repositories.service');
const membershipsService = require('../../../../lib/entities/memberships.service');
const institutionsService = require('../../../../lib/entities/institutions.service');
const usersService = require('../../../../lib/entities/users.service');
const repositoryPermissionsService = require('../../../../lib/entities/repository-permissions.service');

const {
  createInstitution,
} = require('../../../setup/institutions');

const {
  createDefaultActivatedUserAsAdmin,
  createUserAsAdmin,
  activateUser,
} = require('../../../setup/users');

const { getToken, getAdminToken } = require('../../../setup/login');

describe('[repository permission]: Test create features', () => {
  const allPermission = ['memberships:write', 'memberships:read'];
  const readPermission = ['memberships:read'];
  const emptyPermission = [];

  const anotherUserTest = {
    username: 'another.user',
    email: 'another.user@test.fr',
    fullName: 'Another user',
    isAdmin: false,
    password: 'changeme',
    permissions: allPermission,
  };

  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const membershipUserTest = {
    username: userTest.username,
  };
  const membershipTest = {
    username: userTest.username,
  };

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
      describe('Repository publisher', () => {
        let repositoryId;
        beforeAll(async () => {
          ezcounterRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezcounterRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            membershipUserTest.permissions = allPermission;
            membershipUserTest.institutionId = institutionId;
            await membershipsService.create({ data: membershipUserTest });
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it(`#01 DELETE /repositories/:repositoryId/permissions/:username - Should create permission of user [${userTest.username}] for the repository of type [${ezpaarseRepositoryConfig.type}]`, async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 200);

            const permission = httpAppResponse?.data;
            expect(permission).toHaveProperty('username', userTest.username);
            expect(permission).toHaveProperty('institutionId', institutionId);
            expect(permission).toHaveProperty('repositoryId', repositoryId);
            expect(permission).toHaveProperty('readonly', permissionTest.readonly);
            expect(permission).toHaveProperty('locked', permissionTest.locked);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await usersService.deleteAll();
            await membershipsService.deleteAll();
          });
        });
        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      describe('Repository ezPAARSE', () => {
        let repositoryId;
        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            membershipUserTest.permissions = allPermission;
            membershipUserTest.institutionId = institutionId;
            await membershipsService.create({ data: membershipUserTest });
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it(`#02 DELETE /repositories/:repositoryId/permissions/:username - Should create permission of user [${userTest.username}] for the repository of type [${ezpaarseRepositoryConfig.type}]`, async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 200);

            const permission = httpAppResponse?.data;
            expect(permission).toHaveProperty('username', userTest.username);
            expect(permission).toHaveProperty('institutionId', institutionId);
            expect(permission).toHaveProperty('repositoryId', repositoryId);
            expect(permission).toHaveProperty('readonly', permissionTest.readonly);
            expect(permission).toHaveProperty('locked', permissionTest.locked);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await usersService.deleteAll();
            await membershipsService.deleteAll();
          });
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
  describe('As user of institution', () => {
    let userToken;

    beforeAll(async () => {
      await createUserAsAdmin(
        userTest.username,
        userTest.email,
        userTest.fullName,
        userTest.isAdmin,
      );
      await activateUser(
        userTest.username,
        userTest.password,
      );
      userToken = await getToken(userTest.username, userTest.password);
    });
    describe('Institution created by user manager', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);
      });
      describe('Repository publisher', () => {
        let repositoryId;
        beforeAll(async () => {
          ezcounterRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezcounterRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            membershipTest.permissions = allPermission;
            membershipTest.institutionId = institutionId;
            // FIXME membership create by function createInstitution
            // await membershipsService.create({ data: membershipTest });
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it(`#03 DELETE /repositories/:repositoryId/permissions/:username - Should create permission of user [${userTest.username}] for the repository of type [${ezpaarseRepositoryConfig.type}]`, async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 200);

            const permission = httpAppResponse?.data;
            expect(permission).toHaveProperty('username', userTest.username);
            expect(permission).toHaveProperty('institutionId', institutionId);
            expect(permission).toHaveProperty('repositoryId', repositoryId);
            expect(permission).toHaveProperty('readonly', permissionTest.readonly);
            expect(permission).toHaveProperty('locked', permissionTest.locked);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await membershipsService.deleteAll();
          });
        });

        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      describe('Repository ezPAARSE', () => {
        let repositoryId;
        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            membershipTest.permissions = allPermission;
            membershipTest.institutionId = institutionId;
            await membershipsService.create({ data: membershipTest });
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it(`#04 DELETE /repositories/:repositoryId/permissions/:username - Should create permission of user [${userTest.username}] for the repository of type [${ezpaarseRepositoryConfig.type}]`, async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 200);

            const permission = httpAppResponse?.data;
            expect(permission).toHaveProperty('username', userTest.username);
            expect(permission).toHaveProperty('institutionId', institutionId);
            expect(permission).toHaveProperty('repositoryId', repositoryId);
            expect(permission).toHaveProperty('readonly', permissionTest.readonly);
            expect(permission).toHaveProperty('locked', permissionTest.locked);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await membershipsService.deleteAll();
          });
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
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });
      describe('Repository publisher', () => {
        let repositoryId;
        beforeAll(async () => {
          ezcounterRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezcounterRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it('#05 DELETE /repositories/:repositoryId/permissions/:username - Should not create permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 403);
          });

          afterAll(async () => {
            await usersService.deleteAll();
            await repositoryPermissionsService.deleteAll();
          });
        });
        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      describe('Repository ezPAARSE', () => {
        let repositoryId;
        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it('#06 DELETE /repositories/:repositoryId/permissions/:username - Should not create permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,

              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 403);
          });

          afterAll(async () => {
            await usersService.deleteAll();
            await repositoryPermissionsService.deleteAll();
          });
        });
        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });
    describe('Institution created by another user', () => {
      let institutionId;

      beforeAll(async () => {
        await createUserAsAdmin(
          anotherUserTest.username,
          anotherUserTest.email,
          anotherUserTest.fullName,
          anotherUserTest.isAdmin,
        );
        await activateUser(
          anotherUserTest.username,
          anotherUserTest.password,
        );
        institutionId = await createInstitution(institutionTest, anotherUserTest);
      });
      describe('Repository publisher', () => {
        let repositoryId;
        beforeAll(async () => {
          ezcounterRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezcounterRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it('#07 DELETE /repositories/:repositoryId/permissions/:username - Should not create permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 403);
          });

          afterAll(async () => {
            await usersService.deleteAll();
            await repositoryPermissionsService.deleteAll();
          });
        });
        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      describe('Repository ezPAARSE', () => {
        let repositoryId;
        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it('#08 DELETE /repositories/:repositoryId/permissions/:username - Should not create permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 403);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await usersService.deleteAll();
          });
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
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('Repository publisher', () => {
        let repositoryId;
        beforeAll(async () => {
          ezcounterRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezcounterRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            membershipUserTest.permissions = allPermission;
            membershipUserTest.institutionId = institutionId;
            await membershipsService.create({ data: membershipUserTest });
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it('#09 DELETE /repositories/:repositoryId/permissions/:username - Should not create permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: 'Bearer: random',
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 401);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await usersService.deleteAll();
            await membershipsService.deleteAll();
          });
        });
        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      describe('Repository ezPAARSE', () => {
        let repositoryId;
        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            membershipUserTest.permissions = allPermission;
            membershipUserTest.institutionId = institutionId;
            await membershipsService.create({ data: membershipUserTest });
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it('#10 DELETE /repositories/:repositoryId/permissions/:username - Should not create permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: 'Bearer: random',
              },
            });

            expect(httpAppResponse).toHaveProperty('status', 401);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await usersService.deleteAll();
            await membershipsService.deleteAll();
          });
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
  describe('Without token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('Repository publisher', () => {
        let repositoryId;
        beforeAll(async () => {
          ezcounterRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezcounterRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            membershipUserTest.permissions = allPermission;
            membershipUserTest.institutionId = institutionId;
            await membershipsService.create({ data: membershipUserTest });
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it('#11 DELETE /repositories/:repositoryId/permissions/:username - Should not create permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
            });

            expect(httpAppResponse).toHaveProperty('status', 401);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await usersService.deleteAll();
            await membershipsService.deleteAll();
          });
        });
        afterAll(async () => {
          await repositoriesService.deleteAll();
        });
      });
      describe('Repository ezPAARSE', () => {
        let repositoryId;
        beforeAll(async () => {
          ezpaarseRepositoryConfig.institutionId = institutionId;
          const repository = await repositoriesService.create({ data: ezpaarseRepositoryConfig });
          repositoryId = repository.id;
        });

        describe(`Set permission to [${userTest.username}] user`, () => {
          beforeAll(async () => {
            await createDefaultActivatedUserAsAdmin();
            membershipUserTest.permissions = allPermission;
            membershipUserTest.institutionId = institutionId;
            await membershipsService.create({ data: membershipUserTest });
            permissionTest.institutionId = institutionId;
            permissionTest.username = userTest.username;
            await repositoryPermissionsService.create({ data: permissionTest });
          });

          it('#12 DELETE /repositories/:repositoryId/permissions/:username - Should not create permission', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
            });

            expect(httpAppResponse).toHaveProperty('status', 401);
          });

          afterAll(async () => {
            await repositoryPermissionsService.deleteAll();
            await usersService.deleteAll();
            await membershipsService.deleteAll();
          });
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
});
