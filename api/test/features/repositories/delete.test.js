const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, createInstitution, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const createRepositoryAsAdmin = require('../../setup/repositories');

describe('[institutions]: Test repository features', () => {
  describe('Delete', () => {
    const institutionTest = {
      name: 'Test',
      namespace: 'test',
    };
    describe('As admin', () => {
      describe('Institution created by admin', () => {
        describe('DELETE /repositories/<id> - Delete repository of type [ezPAARSE] for [Test] institution', () => {
          let adminToken;
          let institutionId;
          let repositoryId;
          let repositoryConfig;

          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'ezPAARSE',
              institutionId,
              pattern: 'publisher-*',
            };
            repositoryId = await createRepositoryAsAdmin(repositoryConfig);
            adminToken = await getAdminToken();
          });

          it('Should delete repository of type [ezPAARSE] and pattern [ezpaarse-*]', async () => {
            const res = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 204);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
          });
        });
      });
    });
    describe('As user', () => {
      describe('Institution created by user', () => {
        describe('DELETE /repositories/<id> - Delete repository of type [ezPAARSE] for [Test] institution', () => {
          let userToken;
          let institutionId;
          let repositoryConfig;
          let repositoryId;
          let userTest;

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            userToken = await getToken(userTest.username, userTest.password);
            institutionId = await createInstitution(institutionTest, userTest);
            repositoryConfig = {
              type: 'COUNTER 5',
              institutionId,
              pattern: 'publisher-*',
            };
            repositoryId = await createRepositoryAsAdmin(repositoryConfig);
          });

          it('Should get HTTP status 403', async () => {
            const res = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            expect(res).toHaveProperty('status', 403);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
            await deleteUserAsAdmin(userTest.username);
          });
        });
      });

      describe('Institution created by admin', () => {
        describe('DELETE /repositories/<id> - Delete repository of type [ezPAARSE] for [Test] institution', () => {
          let userToken;
          let institutionId;
          let repositoryConfig;
          let repositoryId;
          let userTest;

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            userToken = await getToken(userTest.username, userTest.password);
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'COUNTER 5',
              institutionId,
              pattern: 'publisher-*',
            };
            repositoryId = await createRepositoryAsAdmin(repositoryConfig);
          });

          it('Should get HTTP status 403', async () => {
            const res = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            expect(res).toHaveProperty('status', 403);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
            await deleteUserAsAdmin(userTest.username);
          });
        });
      });
    });
    describe('Without user', () => {
      describe('Institution created by user', () => {
        describe('DELETE /repositories/<id> - Create new repository of type [ezPAARSE] for [Test] institution', () => {
          let institutionId;
          let repositoryConfig;
          let userTest;
          let repositoryId;

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            institutionId = await createInstitution(institutionTest, userTest);
            repositoryConfig = {
              type: 'COUNTER 5',
              institutionId,
              pattern: 'publisher-*',
            };
            repositoryId = await createRepositoryAsAdmin(repositoryConfig);
          });

          it('Should get HTTP status 401', async () => {
            const res = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}`,
            });

            expect(res).toHaveProperty('status', 401);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
            await deleteUserAsAdmin(userTest.username);
          });
        });
      });

      describe('Institution created by admin', () => {
        describe('DELETE /repositories/<id> - Create new repository of type [ezPAARSE] for [Test] institution', () => {
          let institutionId;
          let repositoryConfig;
          let repositoryId;

          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'COUNTER 5',
              institutionId,
              pattern: 'publisher-*',
            };
            repositoryId = await createRepositoryAsAdmin(repositoryConfig);
          });

          it('Should get HTTP status 401', async () => {
            const res = await ezmesure({
              method: 'DELETE',
              url: `/repositories/${repositoryId}`,
            });

            expect(res).toHaveProperty('status', 401);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
          });
        });
      });
    });
  });
});
