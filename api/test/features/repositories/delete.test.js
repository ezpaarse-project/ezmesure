const ezmesure = require('../../setup/ezmesure');

const { createInstitutionAsAdmin, createInstitution, deleteInstitutionAsAdmin } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { createRepositoryAsAdmin } = require('../../setup/repositories');

describe('[repositories]: Test delete features', () => {
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
      });
      describe('DELETE /repositories/<id> - Delete repository of type [ezPAARSE] for [Test] institution', () => {
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
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });
  describe('As user', () => {
    let userTest;
    let userToken;

    beforeAll(async () => {
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });
    describe('Institution created by user', () => {
      let institutionId;

      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);
      });
      describe('DELETE /repositories/<id> - Delete repository of type [ezPAARSE] for [Test] institution', () => {
        const repositoryConfig = {
          type: 'COUNTER 5',
          institutionId,
          pattern: 'publisher-*',
        };
        let repositoryId;

        beforeAll(async () => {
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
      describe('DELETE /repositories/<id> - Delete repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryId;
        const repositoryConfig = {
          type: 'COUNTER 5',
          institutionId,
          pattern: 'publisher-*',
        };

        beforeAll(async () => {
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
      describe('DELETE /repositories/<id> - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryId;
        const repositoryConfig = {
          type: 'COUNTER 5',
          institutionId,
          pattern: 'publisher-*',
        };

        beforeAll(async () => {
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/repositories/${repositoryId}`,
          });

          expect(res).toHaveProperty('status', 401);
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
      describe('DELETE /repositories/<id> - Create new repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryId;
        const repositoryConfig = {
          type: 'COUNTER 5',
          institutionId,
          pattern: 'publisher-*',
        };

        beforeAll(async () => {
          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'DELETE',
            url: `/repositories/${repositoryId}`,
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
