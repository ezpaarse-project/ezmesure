const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, createInstitution, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { createRepositoryAsAdmin, deleteRepositoryAsAdmin } = require('../../setup/repositories');

describe('[repositories]: Test read features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };
  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      adminToken = await getAdminToken();
    });
    describe('Institution created by admin', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });

      describe('GET /repositories/<id> - Get repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryId;
        let repositoryConfig;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'ezPAARSE',
            institutionId,
            pattern: 'publisher-*',
          };
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get repository of type [ezPAARSE] and pattern [ezpaarse-*]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const repository = res?.data;
          expect(repository?.id).not.toBeNull();
          expect(repository).toHaveProperty('institutionId', institutionId);
          expect(repository?.createdAt).not.toBeNull();
          expect(repository?.updatedAt).not.toBeNull();
          expect(repository).toHaveProperty('pattern', repositoryConfig.pattern);
          expect(repository).toHaveProperty('type', repositoryConfig.type);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });

      describe('GET /repositories/<id> - get repository of type [COUNTER 5] for [Test] institution', () => {
        let repositoryId;
        let repositoryConfig;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get repository of type [COUNTER 5] and pattern [publisher-*]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const repository = res?.data;
          expect(repository?.id).not.toBeNull();
          expect(repository).toHaveProperty('institutionId', institutionId);
          expect(repository?.createdAt).not.toBeNull();
          expect(repository?.updatedAt).not.toBeNull();
          expect(repository).toHaveProperty('pattern', repositoryConfig.pattern);
          expect(repository).toHaveProperty('type', repositoryConfig.type);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });

      describe('GET /repositories/<id> - get repository of type [random] for [Test] institution', () => {
        let repositoryConfig;
        let repositoryId;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'random',
            institutionId,
            pattern: 'random-*',
          };
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get repository of type [random] and pattern [random-*]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const repository = res?.data;
          expect(repository?.id).not.toBeNull();
          expect(repository).toHaveProperty('institutionId', institutionId);
          expect(repository?.createdAt).not.toBeNull();
          expect(repository?.updatedAt).not.toBeNull();
          expect(repository).toHaveProperty('pattern', repositoryConfig.pattern);
          expect(repository).toHaveProperty('type', repositoryConfig.type);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });
  describe('As user', () => {
    let userToken;
    let userTest;

    beforeAll(async () => {
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });
    describe('Institution created by user', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);
      });
      describe('GET /repositories/<id> - Get repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryId;
        let repositoryConfig;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          expect(res).toHaveProperty('status', 403);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });

    describe('Institution created by admin', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });
      describe('GET /repositories/<id> - Get repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryId;
        let repositoryConfig;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          expect(res).toHaveProperty('status', 403);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
    afterAll(async () => {
      await deleteUserAsAdmin(userTest.username);
    });
  });
  describe('Without user', () => {
    describe('Institution created by user', () => {
      let institutionId;
      let userTest;

      beforeAll(async () => {
        userTest = await createDefaultActivatedUserAsAdmin();
        institutionId = await createInstitution(institutionTest, userTest);
      });
      describe('GET /repositories/<id> - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryId;
        let repositoryConfig;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
          });

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
        await deleteUserAsAdmin(userTest.username);
      });
    });

    describe('Institution created by admin', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });
      describe('GET /repositories/<id> - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryId;
        let repositoryConfig;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/repositories/${repositoryId}`,
          });

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });
});
