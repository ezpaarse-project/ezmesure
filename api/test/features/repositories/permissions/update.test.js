const ezmesure = require('../../../setup/ezmesure');

const {
  createInstitution,
  createInstitutionAsAdmin,
  validateInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
  addMembershipsToUserAsAdmin,
  deleteMembershipsToUserAsAdmin,
} = require('../../../setup/institutions');
const {
  createDefaultActivatedUserAsAdmin,
  deleteUserAsAdmin,
  createUserAsAdmin,
  activateUser,
} = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');
const {
  createRepositoryAsAdmin,
  deleteRepositoryAsAdmin,
  addPermissionToRepositoryAsAdmin,
  deletePermissionToRepositoryAsAdmin,
} = require('../../../setup/repositories');

describe('[repository permission]: Test delete features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };
  let adminToken;
  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
        await validateInstitutionAsAdmin(institutionId);
      });
      describe('Repository publisher', () => {
        let repositoryConfig;
        let repositoryId;
        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };

          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        describe('PUT /repositories/<id>/permissions/<username> - update permission to [user.test] user', () => {
          let userTest;
          const permissionTest = {
            readonly: true,
            locked: true,
          };

          const newPermissionTest = {
            readonly: true,
            locked: true,
          };

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['memberships:write', 'memberships:read']);
            await addPermissionToRepositoryAsAdmin(repositoryId, userTest.username, permissionTest);
          });

          it('Should update permission of user [user.test] for the repository of type [ezPAARSE]', async () => {
            const res = await ezmesure({
              method: 'PUT',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
              data: newPermissionTest,
            });

            expect(res).toHaveProperty('status', 200);

            const permission = res?.data;
            expect(permission).toHaveProperty('username', userTest.username);
            expect(permission).toHaveProperty('institutionId', institutionId);
            expect(permission).toHaveProperty('repositoryId', repositoryId);
            expect(permission).toHaveProperty('readonly', newPermissionTest.readonly);
            expect(permission).toHaveProperty('locked', newPermissionTest.locked);
          });

          afterAll(async () => {
            await deletePermissionToRepositoryAsAdmin(repositoryId, userTest.username);
            await deleteUserAsAdmin(userTest.username);
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
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
  describe('As user of institution', () => {
    const userManagerTest = {
      username: 'user.manager',
      email: 'user.manager@test.fr',
      fullName: 'User manager',
      isAdmin: false,
      password: 'changeme',
      permissions: ['memberships:write', 'memberships:read'],
    };
    let userManagerToken;

    beforeAll(async () => {
      await createUserAsAdmin(
        userManagerTest.username,
        userManagerTest.email,
        userManagerTest.fullName,
        userManagerTest.isAdmin,
      );
      await activateUser(
        userManagerTest.username,
        userManagerTest.password,
      );
      userManagerToken = await getToken('user.manager', 'changeme');
    });
    describe('Institution created by user manager', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userManagerTest);
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('Repository publisher', () => {
        let repositoryConfig;
        let repositoryId;
        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };

          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        describe('PUT /repositories/<id>/permissions/<username> - update permission to [user.test] user', () => {
          let userTest;
          const permissionTest = {
            readonly: true,
            locked: true,
          };

          const newPermissionTest = {
            readonly: true,
            locked: true,
          };

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['memberships:write', 'memberships:read']);
            await addPermissionToRepositoryAsAdmin(repositoryId, userTest.username, permissionTest);
          });

          it('Should update permission of user [user.test] for the repository of type [ezPAARSE]', async () => {
            const res = await ezmesure({
              method: 'PUT',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
              data: newPermissionTest,
            });

            expect(res).toHaveProperty('status', 200);

            const permission = res?.data;
            expect(permission).toHaveProperty('username', userTest.username);
            expect(permission).toHaveProperty('institutionId', institutionId);
            expect(permission).toHaveProperty('repositoryId', repositoryId);
            expect(permission).toHaveProperty('readonly', newPermissionTest.readonly);
            expect(permission).toHaveProperty('locked', newPermissionTest.locked);
          });

          afterAll(async () => {
            await deletePermissionToRepositoryAsAdmin(repositoryId, userTest.username);
            await deleteUserAsAdmin(userTest.username);
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
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
        await validateInstitutionAsAdmin(institutionId);
      });
      describe('Repository publisher', () => {
        let repositoryConfig;
        let repositoryId;
        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };

          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        describe('PUT /repositories/<id>/permissions/<username> - update permission to [user.test] user', () => {
          let userTest;
          const permissionTest = {
            readonly: true,
            locked: true,
          };

          const newPermissionTest = {
            readonly: true,
            locked: true,
          };

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['memberships:write', 'memberships:read']);
            await addPermissionToRepositoryAsAdmin(repositoryId, userTest.username, permissionTest);
          });

          it('Should get HTTP status 403', async () => {
            const res = await ezmesure({
              method: 'PUT',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
              data: newPermissionTest,
            });

            expect(res).toHaveProperty('status', 403);
          });

          afterAll(async () => {
            await deletePermissionToRepositoryAsAdmin(repositoryId, userTest.username);
            await deleteUserAsAdmin(userTest.username);
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });
        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
      });
    });
    describe('Institution created by another user', () => {
      let institutionId;
      const anotherUserTest = {
        username: 'another.user',
        email: 'another.user@test.fr',
        fullName: 'Another user',
        isAdmin: false,
        password: 'changeme',
        permissions: ['memberships:write', 'memberships:read'],
      };
      beforeAll(async () => {
        await createUserAsAdmin(
          anotherUserTest.username,
          anotherUserTest.email,
          anotherUserTest.fullName,
          anotherUserTest.isAdmin,
        );
        await activateUser(
          anotherUserTest.username,
          anotherUserTest.password,
        );
        institutionId = await createInstitution(institutionTest, anotherUserTest);
        await validateInstitutionAsAdmin(institutionId);
      });
      describe('Repository publisher', () => {
        let repositoryConfig;
        let repositoryId;
        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };

          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        describe('PUT /repositories/<id>/permissions/<username> - update permission to [user.test] user', () => {
          let userTest;
          const permissionTest = {
            readonly: true,
            locked: true,
          };

          const newPermissionTest = {
            readonly: true,
            locked: true,
          };

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['memberships:write', 'memberships:read']);
            await addPermissionToRepositoryAsAdmin(repositoryId, userTest.username, permissionTest);
          });

          it('Should get HTTP status 403', async () => {
            const res = await ezmesure({
              method: 'PUT',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
              data: newPermissionTest,
            });

            expect(res).toHaveProperty('status', 403);
          });

          afterAll(async () => {
            await deletePermissionToRepositoryAsAdmin(repositoryId, userTest.username);
            await deleteUserAsAdmin(userTest.username);
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });
        afterAll(async () => {
          await deleteRepositoryAsAdmin(repositoryId);
        });
      });

      afterAll(async () => {
        await deleteInstitutionAsAdmin(institutionId);
        await deleteUserAsAdmin(anotherUserTest.username);
      });
    });
  });

  describe('With random token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('Repository publisher', () => {
        let repositoryConfig;
        let repositoryId;
        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };

          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        describe('PUT /repositories/<id>/permissions/<username> - update permission to [user.test] user', () => {
          let userTest;
          const permissionTest = {
            readonly: true,
            locked: true,
          };

          const newPermissionTest = {
            readonly: true,
            locked: true,
          };

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['memberships:write', 'memberships:read']);
            await addPermissionToRepositoryAsAdmin(repositoryId, userTest.username, permissionTest);
          });

          it('Should get HTTP status 401', async () => {
            const res = await ezmesure({
              method: 'PUT',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              data: newPermissionTest,
              headers: {
                Authorization: 'Bearer: random',
              },
            });

            expect(res).toHaveProperty('status', 401);
          });

          afterAll(async () => {
            await deletePermissionToRepositoryAsAdmin(repositoryId, userTest.username);
            await deleteUserAsAdmin(userTest.username);
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
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
  describe('Without token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitutionAsAdmin(institutionTest);
        await validateInstitutionAsAdmin(institutionId);
      });

      describe('Repository publisher', () => {
        let repositoryConfig;
        let repositoryId;
        beforeAll(async () => {
          repositoryConfig = {
            type: 'COUNTER 5',
            institutionId,
            pattern: 'publisher-*',
          };

          repositoryId = await createRepositoryAsAdmin(repositoryConfig);
        });

        describe('PUT /repositories/<id>/permissions/<username> - update permission to [user.test] user', () => {
          let userTest;
          const permissionTest = {
            readonly: true,
            locked: true,
          };

          const newPermissionTest = {
            readonly: true,
            locked: true,
          };

          beforeAll(async () => {
            userTest = await createDefaultActivatedUserAsAdmin();
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, ['memberships:write', 'memberships:read']);
            await addPermissionToRepositoryAsAdmin(repositoryId, userTest.username, permissionTest);
          });

          it('Should get HTTP status 401', async () => {
            const res = await ezmesure({
              method: 'PUT',
              url: `/repositories/${repositoryId}/permissions/${userTest.username}`,
              data: newPermissionTest,
            });

            expect(res).toHaveProperty('status', 401);
          });

          afterAll(async () => {
            await deletePermissionToRepositoryAsAdmin(repositoryId, userTest.username);
            await deleteUserAsAdmin(userTest.username);
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
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
