const ezmesure = require('../../../setup/ezmesure');

const {
  createInstitutionAsAdmin,
  deleteInstitutionAsAdmin,
  addMembershipsToUserAsAdmin,
  deleteMembershipsToUserAsAdmin,
} = require('../../../setup/institutions');
const { deleteUserAsAdmin, createUserAsAdmin, activateUser } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');

describe('[institutions - memberships]: Test read memberships features', () => {
  let adminToken;
  let institutionId;

  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
    password: 'changeme',
  };

  beforeAll(async () => {
    adminToken = await getAdminToken();
    institutionId = await createInstitutionAsAdmin(institutionTest);
    await createUserAsAdmin(
      userTest.username,
      userTest.email,
      userTest.fullName,
      userTest.isAdmin,
    );
    await activateUser(userTest.username, userTest.password);
  });

  describe('Unvalidated institution', () => {
    describe('As admin', () => {
      describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
        const userTestPermissions = ['memberships:read'];
        beforeAll(async () => {
          await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
        });

        it('Should get user [user.test] in institution [Test] with permissions [memberships:read]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test] with its members', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const [membership] = res.data.filter((user) => user.username === userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', userTestPermissions);
          expect(membership).toHaveProperty('locked', false);
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
      });

      describe('GET /institutions/<id>/memberships/<username> - Get membership with permissions [memberships:write, memberships:read] of user [user.test] for institution [Test]', () => {
        const userTestPermissions = ['memberships:write', 'memberships:read'];

        beforeAll(async () => {
          await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
        });

        it('Should get user [user.test] in institution [Test] with permissions [memberships:write, memberships:read]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test] with its members', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const [membership] = res.data.filter((user) => user.username === userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', userTestPermissions);
          expect(membership).toHaveProperty('locked', false);
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
      });
    });
    describe('As user', () => {
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
        await addMembershipsToUserAsAdmin(
          institutionId,
          userManagerTest.username,
          userManagerTest.permissions,
        );
        userManagerToken = await getToken(userManagerTest.username, userManagerTest.password);
      });
      describe('As user with permission [memberships:write, memberships:read]', () => {
        beforeAll(async () => {
          userManagerTest.permissions = ['memberships:write', 'memberships:read'];
          await addMembershipsToUserAsAdmin(
            institutionId,
            userManagerTest.username,
            userManagerTest.permissions,
          );
        });
        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = [];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions []', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = ['memberships:read'];
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions [memberships:read]', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:write, memberships:read] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = ['memberships:write', 'memberships:read'];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions [memberships:write, memberships:read]', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });
      });
      describe('As user with permission [memberships:read]', () => {
        beforeAll(async () => {
          userManagerTest.permissions = ['memberships:read'];
          await addMembershipsToUserAsAdmin(
            institutionId,
            userManagerTest.username,
            userManagerTest.permissions,
          );
        });
        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = [];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions []', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members with no change', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = ['memberships:read'];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions [memberships:read]', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members with no change', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:write, memberships:read] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = ['memberships:write', 'memberships:read'];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions [memberships:write, memberships:read]', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members with no change', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });
      });
      afterAll(async () => {
        await deleteUserAsAdmin(userManagerTest.username);
      });
    });
    describe('With random token', () => {
      describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
        const userTestPermissions = ['memberships:read'];

        beforeAll(async () => {
          await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: 'Bearer: random',
            },
          });

          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution [Test] with its members with no change', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const [membership] = res.data.filter((user) => user.username === userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', userTestPermissions);
          expect(membership).toHaveProperty('locked', false);
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
      });
    });
    describe('Without token', () => {
      describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
        const userTestPermissions = ['memberships:read'];

        beforeAll(async () => {
          await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          });

          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution [Test] with its members with no change', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const [membership] = res.data.filter((user) => user.username === userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', userTestPermissions);
          expect(membership).toHaveProperty('locked', false);
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
      });
    });
  });

  describe('Validated institution', () => {
    describe('As admin', () => {
      describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
        const userTestPermissions = ['memberships:read'];
        beforeAll(async () => {
          await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
        });

        it('Should get user [user.test] in institution [Test] with permissions [memberships:read]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test] with its members', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const [membership] = res.data.filter((user) => user.username === userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', userTestPermissions);
          expect(membership).toHaveProperty('locked', false);
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
      });

      describe('GET /institutions/<id>/memberships/<username> - Get membership with permissions [memberships:write, memberships:read] of user [user.test] for institution [Test]', () => {
        const userTestPermissions = ['memberships:write', 'memberships:read'];

        beforeAll(async () => {
          await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
        });

        it('Should get user [user.test] in institution [Test] with permissions [memberships:write, memberships:read]', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          expect(res).toHaveProperty('status', 200);
        });

        it('Should get institution [Test] with its members', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const [membership] = res.data.filter((user) => user.username === userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', userTestPermissions);
          expect(membership).toHaveProperty('locked', false);
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
      });
    });
    describe('As user', () => {
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
        await addMembershipsToUserAsAdmin(
          institutionId,
          userManagerTest.username,
          userManagerTest.permissions,
        );
        userManagerToken = await getToken(userManagerTest.username, userManagerTest.password);
      });
      describe('As user with permission [memberships:write, memberships:read]', () => {
        beforeAll(async () => {
          userManagerTest.permissions = ['memberships:write', 'memberships:read'];
          await addMembershipsToUserAsAdmin(
            institutionId,
            userManagerTest.username,
            userManagerTest.permissions,
          );
        });
        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = [];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions []', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = ['memberships:read'];
          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions [memberships:read]', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:write, memberships:read] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = ['memberships:write', 'memberships:read'];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions [memberships:write, memberships:read]', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });
      });
      describe('As user with permission [memberships:read]', () => {
        beforeAll(async () => {
          userManagerTest.permissions = ['memberships:read'];
          await addMembershipsToUserAsAdmin(
            institutionId,
            userManagerTest.username,
            userManagerTest.permissions,
          );
        });
        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = [];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions []', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members with no change', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = ['memberships:read'];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions [memberships:read]', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members with no change', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });

        describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:write, memberships:read] of user [user.test] for institution [Test]', () => {
          const userTestPermissions = ['memberships:write', 'memberships:read'];

          beforeAll(async () => {
            await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
          });

          it('Should get user [user.test] in institution [Test] with permissions [memberships:write, memberships:read]', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships/${userTest.username}`,
              headers: {
                Authorization: `Bearer ${userManagerToken}`,
              },
            });
            expect(res).toHaveProperty('status', 200);
          });

          it('Should get institution [Test] with its members with no change', async () => {
            const res = await ezmesure({
              method: 'GET',
              url: `/institutions/${institutionId}/memberships`,
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            expect(res).toHaveProperty('status', 200);

            const [membership] = res.data.filter((user) => user.username === userTest.username);
            expect(membership).toHaveProperty('username', userTest.username);
            expect(membership).toHaveProperty('institutionId', institutionId);
            expect(membership).toHaveProperty('roles', []);
            expect(membership).toHaveProperty('permissions', userTestPermissions);
            expect(membership).toHaveProperty('locked', false);
          });

          it('Should get user [user.test] with its institutions', async () => {
            // TODO
          });

          afterAll(async () => {
            await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
          });
        });
      });
      afterAll(async () => {
        await deleteUserAsAdmin(userManagerTest.username);
      });
    });
    describe('With random token', () => {
      describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
        const userTestPermissions = ['memberships:read'];

        beforeAll(async () => {
          await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: 'Bearer: random',
            },
          });

          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution [Test] with its members with no change', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const [membership] = res.data.filter((user) => user.username === userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', userTestPermissions);
          expect(membership).toHaveProperty('locked', false);
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
      });
    });
    describe('Without token', () => {
      describe('GET /institutions/<id>/memberships/<username> - Get membership with permission [memberships:read] of user [user.test] for institution [Test]', () => {
        const userTestPermissions = ['memberships:read'];

        beforeAll(async () => {
          await addMembershipsToUserAsAdmin(institutionId, userTest.username, userTestPermissions);
        });

        it('Should get HTTP status 401', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          });

          expect(res).toHaveProperty('status', 401);
        });

        it('Should get institution [Test] with its members with no change', async () => {
          const res = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          expect(res).toHaveProperty('status', 200);

          const [membership] = res.data.filter((user) => user.username === userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', userTestPermissions);
          expect(membership).toHaveProperty('locked', false);
        });

        it('Should get user [user.test] with its institutions', async () => {
          // TODO
        });

        afterAll(async () => {
          await deleteMembershipsToUserAsAdmin(institutionId, userTest.username);
        });
      });
    });
  });

  afterAll(async () => {
    await deleteUserAsAdmin(userTest.username);
    await deleteInstitutionAsAdmin(institutionId);
  });
});
