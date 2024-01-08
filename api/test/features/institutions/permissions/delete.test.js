const config = require('config');

const ezmesure = require('../../../setup/ezmesure');

const { resetDatabase } = require('../../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../../lib/services/elastic/utils');

const repositoriesPrisma = require('../../../../lib/services/prisma/repositories');
const institutionsPrisma = require('../../../../lib/services/prisma/institutions');
const membershipsPrisma = require('../../../../lib/services/prisma/memberships');
const usersPrisma = require('../../../../lib/services/prisma/users');
const usersElastic = require('../../../../lib/services/elastic/users');
const usersService = require('../../../../lib/entities/users.service');

const repositoryPermissionsPrisma = require('../../../../lib/services/prisma/repository-permissions');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

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
      await resetDatabase();
      await resetElastic();
      adminToken = await usersService.generateToken(adminUsername, adminPassword);
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
            const repositoryPermissionFromServices = await repositoryPermissionsPrisma
              .findMany({});

            expect(repositoryPermissionFromServices).toEqual([]);
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
