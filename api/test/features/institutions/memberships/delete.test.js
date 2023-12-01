const ezmesure = require('../../../setup/ezmesure');

const institutionsService = require('../../../../lib/entities/institutions.service');
const membershipsService = require('../../../../lib/entities/memberships.service');
const usersService = require('../../../../lib/entities/users.service');

const { createUserAsAdmin, activateUser } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');
const { resetDatabase } = require('../../../../lib/services/prisma/utils');

describe('[institutions - memberships]: Test delete memberships features', () => {
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

  beforeAll(async () => {
    await resetDatabase();
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
    await activateUser(
      userTest.username,
      userTest.password,
    );
    membershipUserTest.institutionId = institutionId;
    membershipUserManagerTest.institutionId = institutionId;
  });

  describe('As admin', () => {
    describe(`Delete membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = readPermission;
        await membershipsService.create({ data: membershipUserTest });
      });
      it(`#01 Should delete permissions of user [${userTest.username}] in institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        // Test service
        const membership = await membershipsService.findByID(institutionId, userTest.username);
        expect(membership).toEqual(null);

        // TODO test institutionsService
      });

      afterAll(async () => {
        await membershipsService.removeAll();
      });
    });

    describe(`Delete membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = ['memberships:write', 'memberships:read'];
        await membershipsService.create({ data: membershipUserTest });
      });
      it(`#02 Should delete permissions of user [${userTest.username}] in institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        // Test service
        const membership = await membershipsService.findByID(institutionId, userTest.username);
        expect(membership).toEqual(null);

        // TODO Test institution service
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
        membershipUserManagerTest.permissions = ['memberships:write', 'memberships:read'];
        await membershipsService.create({ data: membershipUserManagerTest });
      });
      describe(`Delete membership with permission [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = allPermission;
          await membershipsService.create({ data: membershipUserTest });
        });

        it('#03 Should delete membership', async () => {
          const httpAppResponse = await ezmesure({
            method: 'DELETE',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${userManagerToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          // Test service
          const membership = await membershipsService.findByID(institutionId, userTest.username);
          expect(membership).toEqual(null);

          // TODO Test institution service
        });
      });

      describe(`Delete membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        const userTestPermissions = readPermission;

        beforeAll(async () => {
          membershipUserTest.permissions = userTestPermissions;
          await membershipsService.create({ data: membershipUserTest });
        });

        it('#04 Should delete membership', async () => {
          const httpAppResponse = await ezmesure({
            method: 'DELETE',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${userManagerToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          // Test service
          const membership = await membershipsService.findByID(institutionId, userTest.username);
          expect(membership).toEqual(null);

          // TODO Test institution service
        });
      });

      describe(`Delete membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = emptyPermission;
          await membershipsService.create({ data: membershipUserTest });
        });

        it('#05 Should delete membership', async () => {
          const httpAppResponse = await ezmesure({
            method: 'DELETE',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
            headers: {
              Authorization: `Bearer ${userManagerToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          // Test service
          const membership = await membershipsService.findByID(institutionId, userTest.username);
          expect(membership).toEqual(null);

          // TODO Test institution service
        });
      });
      afterEach(async () => {
        await membershipsService.removeAll();
      });
    });
    describe(`With permission [${readPermission}]`, () => {
      beforeAll(async () => {
        membershipUserManagerTest.permissions = readPermission;
        await membershipsService.create({ data: membershipUserManagerTest });
      });

      describe(`Delete membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = allPermission;
          await membershipsService.create({ data: membershipUserTest });
        });

        it('#06 Should not delete membership', async () => {
          const httpAppResponse = await ezmesure({
            method: 'DELETE',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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
          expect(membership).toHaveProperty('permissions', allPermission);
          expect(membership).toHaveProperty('locked', false);

          // TODO Test institution service
        });
      });
      afterAll(async () => {
        await membershipsService.removeAll();
      });
    });
  });
  describe('With random token', () => {
    describe(`Delete membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = allPermission;
        await membershipsService.create({ data: membershipUserTest });
      });
      it('#07 Should not delete membership', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const membership = await membershipsService.findByID(institutionId, userTest.username);

        expect(membership).toHaveProperty('username', userTest.username);
        expect(membership).toHaveProperty('institutionId', institutionId);
        expect(membership).toHaveProperty('roles', []);
        expect(membership).toHaveProperty('permissions', allPermission);
        expect(membership).toHaveProperty('locked', false);

        // TODO Test institution service
      });

      afterAll(async () => {
        await membershipsService.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Delete membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = allPermission;
        await membershipsService.create({ data: membershipUserTest });
      });
      it('#08 Should not delete membership', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const membership = await membershipsService.findByID(institutionId, userTest.username);

        expect(membership).toHaveProperty('username', userTest.username);
        expect(membership).toHaveProperty('institutionId', institutionId);
        expect(membership).toHaveProperty('roles', []);
        expect(membership).toHaveProperty('permissions', allPermission);
        expect(membership).toHaveProperty('locked', false);

        // TODO Test institution service
      });

      afterAll(async () => {
        await membershipsService.removeAll();
      });
    });
  });

  afterAll(async () => {
    await resetDatabase();
  });
});
