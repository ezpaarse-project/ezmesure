const ezmesure = require('../../setup/ezmesure');

const {
  createInstitutionAsAdmin, createInstitution, validateInstitutionAsAdmin, deleteInstitutionAsAdmin,
} = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, deleteUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { createRepositoryAsAdmin, deleteRepositoryAsAdmin } = require('../../setup/repositories');

describe('[repositories]: Test update features', () => {
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
        await validateInstitutionAsAdmin(institutionId);
      });
      describe('PATCH /repositories/<pattern> - Update repository of type [ezPAARSE] for [Test] institution', () => {
        let pattern;
        let repositoryConfig;
        const updateRepositoryConfig = {
          pattern: 'update-ezpaarse-*',
          type: 'update-ezPAARSE',
        };

        beforeAll(async () => {
          repositoryConfig = {
            type: 'ezPAARSE',
            institutionId,
            pattern: 'ezpaarse-*',
          };
          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should Update repository of type [ezPAARSE] and pattern [ezpaarse-*]', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
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
          await deleteRepositoryAsAdmin(updateRepositoryConfig?.pattern);
        });
      });

      describe('PATCH /repositories/<pattern> - Update repository of type [COUNTER 5] for [Test] institution', () => {
        let repositoryConfig;
        let pattern;
        const updateRepositoryConfig = {
          pattern: 'update-ezpaarse-*',
          type: 'update-ezPAARSE',
        };

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };

          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should Update repository of type [COUNTER 5] and pattern [publisher-*]', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
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
          await deleteRepositoryAsAdmin(updateRepositoryConfig?.pattern);
        });
      });

      describe('PATCH /repositories/<pattern> - Update repository of type [random] for [Test] institution', () => {
        let repositoryConfig;
        let pattern;
        const updateRepositoryConfig = {
          pattern: 'update-ezpaarse-*',
          type: 'update-ezPAARSE',
        };

        beforeAll(async () => {
          repositoryConfig = {
            type: 'random',
            institutionId,
            pattern: 'random-*',
          };
          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should Update repository of type [random] and pattern [random-*]', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
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
          await deleteRepositoryAsAdmin(updateRepositoryConfig?.pattern);
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
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('PATCH /repositories/<pattern> - Update repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryConfig;
        let pattern;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
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
          await deleteRepositoryAsAdmin(pattern);
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
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('PATCH /repositories/<pattern> - Update repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryConfig;
        let pattern;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 403', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
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
          await deleteRepositoryAsAdmin(pattern);
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
  describe('With random token', () => {
    describe('Institution created by user', () => {
      let institutionId;
      let userTest;

      beforeAll(async () => {
        userTest = await createDefaultActivatedUserAsAdmin();
        institutionId = await createInstitution(institutionTest, userTest);
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('PATCH /repositories/<pattern> - Update repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryConfig;
        let pattern;

        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
            data: {
              type: 'update-ezPAARSE',
              pattern: 'update-publisher-*',
            },
            headers: {
              Authorization: 'Bearer: random',
            },
          });

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(pattern);
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
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('PATCH /repositories/<pattern> - Update repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryConfig;
        let pattern;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
            data: {
              type: 'update-ezPAARSE',
              pattern: 'update-publisher-*',
            },
            headers: {
              Authorization: 'Bearer: random',
            },
          });

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(pattern);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });
  describe('Without user', () => {
    describe('Institution created by user', () => {
      let institutionId;
      let userTest;

      beforeAll(async () => {
        userTest = await createDefaultActivatedUserAsAdmin();
        institutionId = await createInstitution(institutionTest, userTest);
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('PATCH /repositories/<pattern> - Update repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryConfig;
        let pattern;

        beforeAll(async () => {
          userTest = await createDefaultActivatedUserAsAdmin();
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
            data: {
              type: 'update-ezPAARSE',
              pattern: 'update-publisher-*',
            },
          });

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(pattern);
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
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('PATCH /repositories/<pattern> - Update repository of type [ezPAARSE] for [Test] institution', () => {
        let repositoryConfig;
        let pattern;

        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };
          pattern = await createRepositoryAsAdmin(repositoryConfig);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'PATCH',
            url: `/repositories/${pattern}`,
            data: {
              type: 'update-ezPAARSE',
              pattern: 'update-publisher-*',
            },
          });

          expect(res).toHaveProperty('status', 401);
        });

        afterAll(async () => {
          await deleteRepositoryAsAdmin(pattern);
        });
      });
      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
  });
});
