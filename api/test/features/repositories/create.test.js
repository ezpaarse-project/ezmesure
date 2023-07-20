const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, createInstitution, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { deleteRepositoryAsAdmin } = require('../../setup/repositories');

describe('[repositories]: Test create features', () => {
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

      describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryConfig;
        let repositoryId;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'ezPAARSE',
            institutionId,
            pattern: 'ezpaarse-*',
          };
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
          repositoryId = repository?.id;
          expect(repositoryId).not.toBeNull();
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

      describe('POST /repositories - Create new repository of type [COUNTER 5] for [Test] institution', () => {
        let repositoryConfig;
        let repositoryId;
        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
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
          repositoryId = repository?.id;
          expect(repositoryId).not.toBeNull();
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

      describe('POST /repositories - Create new repository of type [random] for [Test] institution', () => {
        let repositoryConfig;
        let repositoryId;
        beforeAll(async () => {
          repositoryConfig = {
            type: 'random',
            institutionId,
            pattern: 'random-*',
          };
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
          repositoryId = repository?.id;
          expect(repositoryId).not.toBeNull();
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
      describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        const repositoryConfig = {
          type: 'COUNTER 5',
          institutionId,
          pattern: 'publisher-*',
        };

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

      describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        const repositoryConfig = {
          type: 'COUNTER 5',
          institutionId,
          pattern: 'publisher-*',
        };

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
      describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        const repositoryConfig = {
          type: 'COUNTER 5',
          institutionId,
          pattern: 'publisher-*',
        };

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/repositories',
            data: repositoryConfig,
          });

          expect(res).toHaveProperty('status', 401);
        });
      });
      afterAll(async () => {
        await deleteUserAsAdmin(userTest.username);
        await deleteInstitutionAsAdmin(institutionId);
      });
    });

    describe('Institution created by admin', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
      });
      describe('POST /repositories - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        const repositoryConfig = {
          type: 'COUNTER 5',
          institutionId,
          pattern: 'publisher-*',
        };

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'POST',
            url: '/repositories',
            data: repositoryConfig,
          });

          expect(res).toHaveProperty('status', 401);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });
});
