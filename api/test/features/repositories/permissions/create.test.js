const ezmesure = require('../../../setup/ezmesure');

const { createInstitutionAsAdmin, deleteInstitutionAsAdmin } = require('../../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../../setup/users');
const { getAdminToken } = require('../../../setup/login');
const { createRepositoryAsAdmin } = require('../../../setup/repositories');

describe('[repository permission]: Test create features', () => {
  const institution = {
    name: 'Test',
    namespace: 'test',
  };
  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      adminToken = await getAdminToken();
    });
    describe('Institution created by admin', () => {
      describe('PUT /repositories/<id>/permissions/<username> - Set permission', () => {
        let institutionId;
        let repositoryId;
        let repositoryConfig;
        let userTest;

        beforeAll(async () => {
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

          console.log(res?.data);

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
