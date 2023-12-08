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

describe('[institutions - memberships]: Test update memberships features', () => {
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

  const allPermission = ['memberships:write', 'memberships:read'];
  const readPermission = ['memberships:read'];
  const basePermission = ['test:read'];
  const emptyPermission = [];

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
    describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = basePermission;
        await membershipsPrisma.create({ data: membershipUserTest });
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
        const membershipFromService = await membershipsPrisma
          .findByID(institutionId, userTest.username);

        expect(membershipFromService).toHaveProperty('username', userTest.username);
        expect(membershipFromService).toHaveProperty('institutionId', institutionId);
        expect(membershipFromService).toHaveProperty('roles', []);
        expect(membershipFromService).toHaveProperty('permissions', readPermission);
        expect(membershipFromService).toHaveProperty('locked', false);
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });

    describe(`Update membership with permissions [memberships:write, memberships:read] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = basePermission;
        await membershipsPrisma.create({ data: membershipUserTest });
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
        const membershipFromService = await membershipsPrisma
          .findByID(institutionId, userTest.username);

        expect(membershipFromService).toHaveProperty('username', userTest.username);
        expect(membershipFromService).toHaveProperty('institutionId', institutionId);
        expect(membershipFromService).toHaveProperty('roles', []);
        expect(membershipFromService).toHaveProperty('permissions', allPermission);
        expect(membershipFromService).toHaveProperty('locked', false);
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });
  describe('As user', () => {
    beforeAll(async () => {
      await usersPrisma.create({ data: userManagerTest });
      await usersElastic.createUser(userManagerTest);

      userManagerToken = await usersService
        .generateToken(userManagerTest.username, userManagerPassword);
    });
    describe(`With permission [${allPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = allPermission;
        await membershipsPrisma.create({ data: membershipUserManagerTest });
      });
      describe(`Update membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = basePermission;
          await membershipsPrisma.create({ data: membershipUserTest });
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
          const membershipFromService = await membershipsPrisma
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
          await membershipsPrisma.create({ data: membershipUserTest });
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
          const membershipFromService = await membershipsPrisma
            .findByID(institutionId, userTest.username);

          expect(membershipFromService).toHaveProperty('username', userTest.username);
          expect(membershipFromService).toHaveProperty('institutionId', institutionId);
          expect(membershipFromService).toHaveProperty('roles', []);
          expect(membershipFromService).toHaveProperty('permissions', readPermission);
          expect(membershipFromService).toHaveProperty('locked', false);
        });
      });
      afterEach(async () => {
        await membershipsPrisma.removeAll();
      });
    });
    describe(`With permission [${readPermission}]`, () => {
      beforeAll(async () => {
        membershipUserManagerTest.permissions = ['memberships:read'];
        await membershipsPrisma.create({ data: membershipUserManagerTest });
      });

      describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = basePermission;
          await membershipsPrisma.create({ data: membershipUserTest });
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
          const membership = await membershipsPrisma.findByID(institutionId, userTest.username);

          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('roles', []);
          expect(membership).toHaveProperty('permissions', basePermission);
          expect(membership).toHaveProperty('locked', false);
        });
      });
      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });
  describe('With random token', () => {
    describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = basePermission;
        await membershipsPrisma.create({ data: membershipUserTest });
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
        const membership = await membershipsPrisma.findByID(institutionId, userTest.username);

        expect(membership).toHaveProperty('username', userTest.username);
        expect(membership).toHaveProperty('institutionId', institutionId);
        expect(membership).toHaveProperty('roles', []);
        expect(membership).toHaveProperty('permissions', basePermission);
        expect(membership).toHaveProperty('locked', false);
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Update membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = basePermission;
        await membershipsPrisma.create({ data: membershipUserTest });
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
        const membership = await membershipsPrisma.findByID(institutionId, userTest.username);

        expect(membership).toHaveProperty('username', userTest.username);
        expect(membership).toHaveProperty('institutionId', institutionId);
        expect(membership).toHaveProperty('roles', []);
        expect(membership).toHaveProperty('permissions', basePermission);
        expect(membership).toHaveProperty('locked', false);
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
