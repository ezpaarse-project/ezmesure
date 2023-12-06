const config = require('config');

const ezmesure = require('../../../setup/ezmesure');

const { resetDatabase } = require('../../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../../lib/services/elastic/utils');

const institutionsPrisma = require('../../../../lib/services/prisma/institutions');
const membershipsPrisma = require('../../../../lib/services/prisma/memberships');
const usersPrisma = require('../../../../lib/services/prisma/users');
const usersElastic = require('../../../../lib/services/elastic/users');
const usersService = require('../../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[institutions - memberships]: Test delete memberships features', () => {
  const allPermission = ['memberships:write', 'memberships:read'];
  const readPermission = ['memberships:read'];
  const emptyPermission = [];

  let adminToken;
  let institutionId;

  const institutionTest = {
    name: 'Test',
  };

  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const membershipUserTest = {
    username: userTest.username,
  };

  const userManagerTest = {
    username: 'user.manager',
    email: 'user.manager@test.fr',
    fullName: 'User manager',
    isAdmin: false,
  };

  const userManagerPassword = 'changeme';

  const membershipUserManagerTest = {
    username: userManagerTest.username,
  };

  let userManagerToken;

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await usersService.generateToken(adminUsername, adminPassword);

    const institution = await institutionsPrisma.create({ data: institutionTest });
    institutionId = institution.id;

    await usersPrisma.create({ data: userTest });
    await usersElastic.createUser(userTest);

    membershipUserTest.institutionId = institutionId;
    membershipUserManagerTest.institutionId = institutionId;
  });

  describe('As admin', () => {
    describe(`Delete membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = readPermission;
        await membershipsPrisma.create({ data: membershipUserTest });
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
        const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
        expect(membership).toEqual(null);

        // TODO test institutionsPrisma
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });

    describe(`Delete membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = ['memberships:write', 'memberships:read'];
        await membershipsPrisma.create({ data: membershipUserTest });
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
        const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
        expect(membership).toEqual(null);

        // TODO Test institution service
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });
  describe('As user', () => {
    beforeAll(async () => {
      // TODO use service to create user
      await usersPrisma.create({ data: userManagerTest });
      await usersElastic.createUser(userManagerTest);

      userManagerToken = await usersService
        .generateToken(userManagerTest.username, userManagerPassword);
    });
    describe(`With permission [${allPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = ['memberships:write', 'memberships:read'];
        await membershipsPrisma.create({ data: membershipUserManagerTest });
      });
      describe(`Delete membership with permission [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = allPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
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
          const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
          expect(membership).toEqual(null);

          // TODO Test institution service
        });
      });

      describe(`Delete membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        const userTestPermissions = readPermission;

        beforeAll(async () => {
          membershipUserTest.permissions = userTestPermissions;
          await membershipsPrisma.create({ data: membershipUserTest });
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
          const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
          expect(membership).toEqual(null);

          // TODO Test institution service
        });
      });

      describe(`Delete membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = emptyPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
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
          const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
          expect(membership).toEqual(null);

          // TODO Test institution service
        });
      });
      afterEach(async () => {
        await membershipsPrisma.removeAll();
      });
    });
    describe(`With permission [${readPermission}]`, () => {
      beforeAll(async () => {
        membershipUserManagerTest.permissions = readPermission;
        await membershipsPrisma.create({ data: membershipUserManagerTest });
      });

      describe(`Delete membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = allPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
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
          const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', allPermission);
          expect(membership).toHaveProperty('locked', false);

          // TODO Test institution service
        });
      });
      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });
  describe('With random token', () => {
    describe(`Delete membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = allPermission;
        await membershipsPrisma.create({ data: membershipUserTest });
      });
      it('#07 Should not delete membership', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const membership = await membershipsPrisma.findByID(institutionId, userTest.username);

        expect(membership).toHaveProperty('username', userTest.username);
        expect(membership).toHaveProperty('institutionId', institutionId);
        expect(membership).toHaveProperty('roles', []);
        expect(membership).toHaveProperty('permissions', allPermission);
        expect(membership).toHaveProperty('locked', false);

        // TODO Test institution service
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Delete membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = allPermission;
        await membershipsPrisma.create({ data: membershipUserTest });
      });
      it('#08 Should not delete membership', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Test service
        const membership = await membershipsPrisma.findByID(institutionId, userTest.username);

        expect(membership).toHaveProperty('username', userTest.username);
        expect(membership).toHaveProperty('institutionId', institutionId);
        expect(membership).toHaveProperty('roles', []);
        expect(membership).toHaveProperty('permissions', allPermission);
        expect(membership).toHaveProperty('locked', false);

        // TODO Test institution service
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });

  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
