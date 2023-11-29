const ezmesure = require('../../../setup/ezmesure');

const institutionsService = require('../../../../lib/entities/institutions.service');
const membershipsService = require('../../../../lib/entities/memberships.service');
const usersService = require('../../../../lib/entities/users.service');

const { createUserAsAdmin, activateUser } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');

describe('[institutions - memberships]: Test update memberships features', () => {
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
  const membershipUserTest = {
    username: userTest.username,
  };

  const userManagerTest = {
    username: 'user.manager',
    email: 'user.manager@test.fr',
    fullName: 'User manager',
    isAdmin: false,
    password: 'changeme',
  };
  const membershipUserManagerTest = {
    username: userManagerTest.username,
  };

  let userManagerToken;

  const allPermission = ['memberships:write', 'memberships:read'];
  const readPermission = ['memberships:read'];
  const basePermission = ['test:read'];
  const emptyPermission = [];

  beforeAll(async () => {
    adminToken = await getAdminToken();

    const institution = await institutionsService.create({ data: institutionTest });
    institutionId = institution.id;

    // TODO use service to create user
    await createUserAsAdmin(
      userTest.username,
      userTest.email,
      userTest.fullName,
      userTest.isAdmin,
    );
    await activateUser(userTest.username, userTest.password);

    membershipUserTest.institutionId = institutionId;
    membershipUserManagerTest.institutionId = institutionId;
  });
  describe('As admin', () => {
    describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = basePermission;
        await membershipsService.create({ data: membershipUserTest });
      });

      it(`#01 Should update user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${readPermission}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          data: {
            permissions: readPermission,
          },
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const membershipFromResponse = httpAppResponse?.data;

        expect(membershipFromResponse).toHaveProperty('username', userTest.username);
        expect(membershipFromResponse).toHaveProperty('institutionId', institutionId);
        expect(membershipFromResponse).toHaveProperty('roles', []);
        expect(membershipFromResponse).toHaveProperty('permissions', readPermission);
        expect(membershipFromResponse).toHaveProperty('locked', false);

        // Test service
        const membershipFromService = await membershipsService
          .findByID(institutionId, userTest.username);

        expect(membershipFromService).toHaveProperty('username', userTest.username);
        expect(membershipFromService).toHaveProperty('institutionId', institutionId);
        expect(membershipFromService).toHaveProperty('roles', []);
        expect(membershipFromService).toHaveProperty('permissions', readPermission);
        expect(membershipFromService).toHaveProperty('locked', false);
      });

      afterAll(async () => {
        await membershipsService.deleteAll();
      });
    });

    describe(`Update membership with permissions [memberships:write, memberships:read] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = basePermission;
        await membershipsService.create({ data: membershipUserTest });
      });

      it(`#02 Should update user [${userTest.username}] in institution [${institutionTest.name}] with permissions [memberships:write, memberships:read]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          data: {
            permissions: allPermission,
          },
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const membershipFromResponse = httpAppResponse?.data;

        expect(membershipFromResponse).toHaveProperty('username', userTest.username);
        expect(membershipFromResponse).toHaveProperty('institutionId', institutionId);
        expect(membershipFromResponse).toHaveProperty('roles', []);
        expect(membershipFromResponse).toHaveProperty('permissions', allPermission);
        expect(membershipFromResponse).toHaveProperty('locked', false);

        // Test service
        const membershipFromService = await membershipsService
          .findByID(institutionId, userTest.username);

        expect(membershipFromService).toHaveProperty('username', userTest.username);
        expect(membershipFromService).toHaveProperty('institutionId', institutionId);
        expect(membershipFromService).toHaveProperty('roles', []);
        expect(membershipFromService).toHaveProperty('permissions', allPermission);
        expect(membershipFromService).toHaveProperty('locked', false);
      });

      afterAll(async () => {
        await membershipsService.deleteAll();
      });
    });
  });
  describe('As user', () => {
    beforeAll(async () => {
      // TODO use service to create user
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
    describe(`With permission [${allPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = allPermission;
        await membershipsService.create({ data: membershipUserManagerTest });
      });
      describe(`Update membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = basePermission;
          await membershipsService.create({ data: membershipUserTest });
        });

        it(`#03 Should update user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${emptyPermission}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            data: {
              permissions: emptyPermission,
            },
            headers: {
              Authorization: `Bearer ${userManagerToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          const membershipFromResponse = httpAppResponse?.data;

          expect(membershipFromResponse).toHaveProperty('username', userTest.username);
          expect(membershipFromResponse).toHaveProperty('institutionId', institutionId);
          expect(membershipFromResponse).toHaveProperty('roles', []);
          expect(membershipFromResponse).toHaveProperty('permissions', emptyPermission);
          expect(membershipFromResponse).toHaveProperty('locked', false);

          // Test service
          const membershipFromService = await membershipsService
            .findByID(institutionId, userTest.username);

          expect(membershipFromService).toHaveProperty('username', userTest.username);
          expect(membershipFromService).toHaveProperty('institutionId', institutionId);
          expect(membershipFromService).toHaveProperty('roles', []);
          expect(membershipFromService).toHaveProperty('permissions', emptyPermission);
          expect(membershipFromService).toHaveProperty('locked', false);
        });
      });

      describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = basePermission;
          await membershipsService.create({ data: membershipUserTest });
        });

        it(`#04 Should update user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${readPermission}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            data: {
              permissions: readPermission,
            },
            headers: {
              Authorization: `Bearer ${userManagerToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          const membershipFromResponse = httpAppResponse?.data;

          expect(membershipFromResponse).toHaveProperty('username', userTest.username);
          expect(membershipFromResponse).toHaveProperty('institutionId', institutionId);
          expect(membershipFromResponse).toHaveProperty('roles', []);
          expect(membershipFromResponse).toHaveProperty('permissions', readPermission);
          expect(membershipFromResponse).toHaveProperty('locked', false);

          // Test service
          const membershipFromService = await membershipsService
            .findByID(institutionId, userTest.username);

          expect(membershipFromService).toHaveProperty('username', userTest.username);
          expect(membershipFromService).toHaveProperty('institutionId', institutionId);
          expect(membershipFromService).toHaveProperty('roles', []);
          expect(membershipFromService).toHaveProperty('permissions', readPermission);
          expect(membershipFromService).toHaveProperty('locked', false);
        });
      });
      afterEach(async () => {
        await membershipsService.deleteAll();
      });
    });
    describe(`With permission [${readPermission}]`, () => {
      beforeAll(async () => {
        membershipUserManagerTest.permissions = ['memberships:read'];
        await membershipsService.create({ data: membershipUserManagerTest });
      });

      describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = basePermission;
          await membershipsService.create({ data: membershipUserTest });
        });

        it(`#05 Should get memberships between user [${userTest.username}] institution [${institutionTest.name}] without update`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'PUT',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            data: {
              permissions: readPermission,
            },
            headers: {
              Authorization: `Bearer ${userManagerToken}`,
            },
          });
          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);

          // Test service
          const membership = await membershipsService.findByID(institutionId, userTest.username);

          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', basePermission);
          expect(membership).toHaveProperty('locked', false);
        });
      });
      afterAll(async () => {
        await membershipsService.deleteAll();
      });
    });
  });
  describe('With random token', () => {
    describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = basePermission;
        await membershipsService.create({ data: membershipUserTest });
      });

      it(`#06 Should get memberships between user [${userTest.username}] institution [${institutionTest.name}] without update`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          data: {
            permissions: allPermission,
          },
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const membership = await membershipsService.findByID(institutionId, userTest.username);

        expect(membership).toHaveProperty('username', userTest.username);
        expect(membership).toHaveProperty('institutionId', institutionId);
        expect(membership).toHaveProperty('roles', []);
        expect(membership).toHaveProperty('permissions', basePermission);
        expect(membership).toHaveProperty('locked', false);
      });

      afterAll(async () => {
        await membershipsService.deleteAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = basePermission;
        await membershipsService.create({ data: membershipUserTest });
      });

      it(`#07 Should get memberships between user [${userTest.username}] institution [${institutionTest.name}] without update`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          data: {
            permissions: allPermission,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const membership = await membershipsService.findByID(institutionId, userTest.username);

        expect(membership).toHaveProperty('username', userTest.username);
        expect(membership).toHaveProperty('institutionId', institutionId);
        expect(membership).toHaveProperty('roles', []);
        expect(membership).toHaveProperty('permissions', basePermission);
        expect(membership).toHaveProperty('locked', false);
      });

      afterAll(async () => {
        await membershipsService.deleteAll();
      });
    });
  });
  afterAll(async () => {
    await usersService.deleteAll();
    await institutionsService.deleteAll();
  });
});
