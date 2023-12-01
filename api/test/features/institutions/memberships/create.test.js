const ezmesure = require('../../../setup/ezmesure');

const institutionsService = require('../../../../lib/entities/institutions.service');
const membershipsService = require('../../../../lib/entities/memberships.service');
const usersService = require('../../../../lib/entities/users.service');

const { createUserAsAdmin, activateUser } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');

describe('[institutions - memberships]: Test create memberships features', () => {
  const allPermission = ['memberships:write', 'memberships:read'];
  const readPermission = ['memberships:read'];
  const emptyPermission = [];

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

  beforeAll(async () => {
    adminToken = await getAdminToken();

    const institution = await institutionsService.create({ data: institutionTest });
    institutionId = institution.id;

    membershipUserManagerTest.institutionId = institutionId;

    // TODO use service to create user
    await createUserAsAdmin(
      userTest.username,
      userTest.email,
      userTest.fullName,
      userTest.isAdmin,
    );
    await activateUser(userTest.username, userTest.password);
  });

  describe('As admin', () => {
    describe(`Add membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      it(`#01 Should attach user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${readPermission}]`, async () => {
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

        const membershipFromResponse = httpAppResponse.data;
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

        // TODO test institutionsService
      });

      afterAll(async () => {
        await membershipsService.removeAll();
      });
    });

    describe(`Add membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      it(`#02 Should attach user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${allPermission}]`, async () => {
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

        const membershipFromResponse = httpAppResponse.data;
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

        // TODO test institutionsService
      });

      afterAll(async () => {
        await membershipsService.removeAll();
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

      describe(`Add membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        it(`#03 Should attach user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${emptyPermission}]`, async () => {
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

          const membershipFromResponse = httpAppResponse.data;
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

          // TODO test institutionsService
        });
      });

      describe(`Add membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        it(`#04 Should attach user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${readPermission}]`, async () => {
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

          // Test service
          const membership = await membershipsService.findByID(institutionId, userTest.username);

          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', readPermission);
          expect(membership).toHaveProperty('locked', false);

          // TODO test institutionsService
        });
      });
      afterEach(async () => {
        await membershipsService.removeAll();
      });
    });
    describe(`With permission [${readPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = readPermission;
        await membershipsService.create({ data: membershipUserManagerTest });
      });

      describe(`Add membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        it(`#05 Should not add membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, async () => {
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
          expect(membership).toEqual(null);

          // TODO test institutionsService
        });
      });

      afterEach(async () => {
        await membershipsService.removeAll();
      });
    });
  });
  describe('With random token', () => {
    describe(`Add membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      it(`#06 Should not add membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          data: {
            permissions: readPermission,
          },
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const membership = await membershipsService.findByID(institutionId, userTest.username);
        expect(membership).toEqual(null);

        // TODO test institutionsService
      });

      afterAll(async () => {
        await membershipsService.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Add membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      it(`#07 Should not add membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          data: {
            permissions: readPermission,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const membership = await membershipsService.findByID(institutionId, userTest.username);
        expect(membership).toEqual(null);

        // TODO test institutionsService
      });

      afterAll(async () => {
        await membershipsService.removeAll();
      });
    });
  });
  afterAll(async () => {
    await usersService.removeAll();
    await institutionsService.removeAll();
  });
});
