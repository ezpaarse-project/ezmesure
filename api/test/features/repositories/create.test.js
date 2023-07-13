const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, createInstitution, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test repository features', () => {
  describe('Create', () => {
    const institutionTest = {
      name: 'Test',
      namespace: 'test',
    };
    describe('As admin', () => {
      describe('Institution created by admin', () => {
        describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
          let adminToken;
          let institutionId;
          let repositoryConfig;

          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'ezPAARSE',
              institutionId,
              pattern: 'ezpaarse-*',
            };
            adminToken = await getAdminToken();
          });

          it('Should create repository of type [ezPAARSE] and pattern [ezpaarse-*]', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/repositories',
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: repositoryConfig,
            });

            expect(res).toHaveProperty('status', 201);

            const repository = res?.data;
            expect(repository?.id).not.toBeNull();
            expect(repository).toHaveProperty('institutionId', institutionId);
            expect(repository?.createdAt).not.toBeNull();
            expect(repository?.updatedAt).not.toBeNull();
            expect(repository).toHaveProperty('pattern', repositoryConfig.pattern);
            expect(repository).toHaveProperty('type', repositoryConfig.type);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
          });
        });

        describe('POST /repositories - Create new repository of type [COUNTER 5] for [Test] institution', () => {
          let adminToken;
          let institutionId;
          let repositoryConfig;
          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'COUNTER 5',
              institutionId,
              pattern: 'publisher-*',
            };
            adminToken = await getAdminToken();
          });

          it('Should create repository of type [COUNTER 5] and pattern [publisher-*]', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/repositories',
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: repositoryConfig,
            });

            expect(res).toHaveProperty('status', 201);

            const repository = res?.data;
            expect(repository?.id).not.toBeNull();
            expect(repository).toHaveProperty('institutionId', institutionId);
            expect(repository?.createdAt).not.toBeNull();
            expect(repository?.updatedAt).not.toBeNull();
            expect(repository).toHaveProperty('pattern', repositoryConfig.pattern);
            expect(repository).toHaveProperty('type', repositoryConfig.type);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
          });
        });

        describe('POST /repositories - Create new repository of type [random] for [Test] institution', () => {
          let adminToken;
          let institutionId;
          let repositoryConfig;
          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'random',
              institutionId,
              pattern: 'random-*',
            };
            adminToken = await getAdminToken();
          });

          it('Should create repositories of type [random] and pattern [random-*]', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/repositories',
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: repositoryConfig,
            });

            expect(res).toHaveProperty('status', 201);

            const repository = res?.data;
            expect(repository?.id).not.toBeNull();
            expect(repository).toHaveProperty('institutionId', institutionId);
            expect(repository?.createdAt).not.toBeNull();
            expect(repository?.updatedAt).not.toBeNull();
            expect(repository).toHaveProperty('pattern', repositoryConfig.pattern);
            expect(repository).toHaveProperty('type', repositoryConfig.type);
          });

          afterAll(async () => {
            await deleteInstitutionAsAdmin(institutionId);
          });
        });
      });
    });
    describe('As user', () => {
      describe('Institution created by user', () => {
        describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
          let userToken;
          let institutionId;
          let repositoryConfig;
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
          });

          it('Should get HTTP status 403', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/repositories',
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: repositoryConfig,
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
        describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
          let userToken;
          let institutionId;
          let repositoryConfig;
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
          });

          it('Should get HTTP status 403', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/repositories',
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: repositoryConfig,
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
        describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
          let institutionId;
          let repositoryConfig;
          let userTest;

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            institutionId = await createInstitution(institutionTest, userTest);
            repositoryConfig = {
              type: 'COUNTER 5',
              institutionId,
              pattern: 'publisher-*',
            };
          });

          it('Should get HTTP status 401', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/repositories',
              data: repositoryConfig,
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
        describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
          let institutionId;
          let repositoryConfig;

          beforeAll(async () => {
            institutionId = await createInstitutionAsAdmin(institutionTest);
            repositoryConfig = {
              type: 'COUNTER 5',
              institutionId,
              pattern: 'publisher-*',
            };
          });

          it('Should get HTTP status 401', async () => {
            const res = await ezmesure({
              method: 'POST',
              url: '/repositories',
              data: repositoryConfig,
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
