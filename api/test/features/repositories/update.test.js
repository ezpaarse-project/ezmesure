const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, createInstitution, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const createRepositoryAsAdmin = require('../../setup/repositories');

describe('[institutions]: Test repository features', () => {
  describe('Update', () => {
    const institutionTest = {
      name: 'Test',
      namespace: 'test',
    };
    describe('As admin', () => {
      describe('Institution created by admin', () => {
        describe('PATCH /repositories/<id> - Update repository of type [ezPAARSE] for [Test] institution', () => {
          let adminToken;
          let institutionId;
          let repositoryId;
          let repositoryConfig;
          let updateRepositoryConfig;

          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'ezPAARSE',
              institutionId,
              pattern: 'ezpaarse-*',
            };
            updateRepositoryConfig = {
              pattern: 'update-ezpaarse-*',
              type: 'update-ezPAARSE',
            };

            repositoryId = await createRepositoryAsAdmin(repositoryConfig);

            adminToken = await getAdminToken();
          });

          it('Should Update repository of type [ezPAARSE] and pattern [ezpaarse-*]', async () => {
            const res = await ezmesure({
              method: 'PATCH',
              url: `/repositories/${repositoryId}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: updateRepositoryConfig,
            });

            expect(res).toHaveProperty('status', 200);

            const repository = res?.data;

            expect(repository?.id).not.toBeNull();
            expect(repository).toHaveProperty('institutionId', institutionId);
            expect(repository?.createdAt).not.toBeNull();
            expect(repository?.updatedAt).not.toBeNull();
            expect(repository).toHaveProperty('pattern', updateRepositoryConfig?.pattern);
            expect(repository).toHaveProperty('type', updateRepositoryConfig?.type);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
          });
        });

        describe('PATCH /repositories/<id> - Update repository of type [COUNTER 5] for [Test] institution', () => {
          let adminToken;
          let institutionId;
          let repositoryConfig;
          let repositoryId;
          let updateRepositoryConfig;

          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);

            repositoryConfig = {
              type: 'COUNTER 5',
              institutionId,
              pattern: 'publisher-*',
            };

            updateRepositoryConfig = {
              pattern: 'update-ezpaarse-*',
              type: 'update-ezPAARSE',
            };

            repositoryId = await createRepositoryAsAdmin(repositoryConfig);

            adminToken = await getAdminToken();
          });

          it('Should Update repository of type [COUNTER 5] and pattern [publisher-*]', async () => {
            const res = await ezmesure({
              method: 'PATCH',
              url: `/repositories/${repositoryId}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: updateRepositoryConfig,
            });

            expect(res).toHaveProperty('status', 200);

            const repository = res?.data;

            expect(repository?.id).not.toBeNull();
            expect(repository).toHaveProperty('institutionId', institutionId);
            expect(repository?.createdAt).not.toBeNull();
            expect(repository?.updatedAt).not.toBeNull();
            expect(repository).toHaveProperty('pattern', updateRepositoryConfig?.pattern);
            expect(repository).toHaveProperty('type', updateRepositoryConfig?.type);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
          });
        });

        describe('PATCH /repositories/<id> - Update repository of type [random] for [Test] institution', () => {
          let adminToken;
          let institutionId;
          let repositoryConfig;
          let repositoryId;
          let updateRepositoryConfig;

          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'random',
              institutionId,
              pattern: 'random-*',
            };
            updateRepositoryConfig = {
              pattern: 'update-ezpaarse-*',
              type: 'update-ezPAARSE',
            };
            repositoryId = await createRepositoryAsAdmin(repositoryConfig);
            adminToken = await getAdminToken();
          });

          it('Should Update repository of type [random] and pattern [random-*]', async () => {
            const res = await ezmesure({
              method: 'PATCH',
              url: `/repositories/${repositoryId}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: updateRepositoryConfig,
            });

            expect(res).toHaveProperty('status', 200);

            const repository = res?.data;

            expect(repository?.id).not.toBeNull();
            expect(repository).toHaveProperty('institutionId', institutionId);
            expect(repository?.createdAt).not.toBeNull();
            expect(repository?.updatedAt).not.toBeNull();
            expect(repository).toHaveProperty('pattern', updateRepositoryConfig?.pattern);
            expect(repository).toHaveProperty('type', updateRepositoryConfig?.type);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
          });
        });
      });
    });
    describe('As user', () => {
      describe('Institution created by user', () => {
        describe('PATCH /repositories/<id> - Update repository of type [ezPAARSE] for [Test] institution', () => {
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
              method: 'PATCH',
              url: `/repositories/${repositoryId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: {
                type: 'update-ezPAARSE',
                pattern: 'update-publisher-*',
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
        describe('PATCH /repositories/<id> - Update repository of type [ezPAARSE] for [Test] institution', () => {
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
              method: 'PATCH',
              url: `/repositories/${repositoryId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: {
                type: 'update-ezPAARSE',
                pattern: 'update-publisher-*',
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
        describe('PATCH /repositories/<id> - Update repository of type [ezPAARSE] for [Test] institution', () => {
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
              method: 'PATCH',
              url: `/repositories/${repositoryId}`,
              data: {
                type: 'update-ezPAARSE',
                pattern: 'update-publisher-*',
              },
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
        describe('PATCH /repositories/<id> - Update repository of type [ezPAARSE] for [Test] institution', () => {
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
              method: 'PATCH',
              url: `/repositories/${repositoryId}`,
              data: {
                type: 'update-ezPAARSE',
                pattern: 'update-publisher-*',
              },
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
