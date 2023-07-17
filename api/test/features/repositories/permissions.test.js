const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, createInstitution, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const createRepositoryAsAdmin = require('../../setup/repositories');

describe('[institutions]: Test repository-permission features', () => {
  describe('Create', () => {
    describe('As admin', () => {
      describe('Institution created by admin', () => {
        describe('PUT /repositories/<id>/permissions/<username> - Set permission', () => {
          let adminToken;
          let institutionId;
          let repositoryId;
          let repositoryConfig;
          let userTest;

          beforeAll(async () => {
            const institution = {
              name: 'Test',
              namespace: 'test',
            };

            institutionId = await createInstitutionAsAdmin(institution);
            userTest = await createDefaultActivatedUserAsAdmin();

            repositoryConfig = {
              type: 'ezPAARSE',
              institutionId,
              pattern: 'publisher-*',
            };

            repositoryId = await createRepositoryAsAdmin(repositoryConfig);

            adminToken = await getAdminToken();
          });

          it('Should get repository of type [ezPAARSE] and pattern [ezpaarse-*]', async () => {
            const res = await ezmesure({
              method: 'PUT',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            // TODO
            expect(res).toHaveProperty('status', 400);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
            await deleteUserAsAdmin(userTest.username);
          });
        });
      });
    });
  });
});
