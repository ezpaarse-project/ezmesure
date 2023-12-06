const config = require('config');

const ezmesure = require('../../../setup/ezmesure');

const { resetDatabase } = require('../../../../lib/services/prisma/utils');

const institutionsPrisma = require('../../../../lib/services/prisma/institutions');
const membershipsPrisma = require('../../../../lib/services/prisma/memberships');
const usersPrisma = require('../../../../lib/services/prisma/users');
const usersElastic = require('../../../../lib/services/elastic/users');
const usersService = require('../../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[institutions - memberships]: Test read memberships features', () => {
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
    adminToken = await usersService.generateToken(adminUsername, adminPassword);

    const institution = await institutionsPrisma.create({ data: institutionTest });
    institutionId = institution.id;

    await usersPrisma.create({ data: userTest });
    await usersElastic.createUser(userTest);

    membershipUserTest.institutionId = institutionId;
    membershipUserManagerTest.institutionId = institutionId;
  });

  describe('As admin', () => {
    describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = readPermission;
        await membershipsPrisma.create({ data: membershipUserTest });
      });

      it(`#01 Should get user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${readPermission}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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

        // TODO Test institution service
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });

    describe(`Get membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = allPermission;
        await membershipsPrisma.create({ data: membershipUserTest });
      });

      it(`#02 Should get user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${allPermission}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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
    describe(`As user with permission [${allPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = allPermission;
        await membershipsPrisma.create({ data: membershipUserManagerTest });
      });

      describe(`Get membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeEach(async () => {
          membershipUserTest.permissions = emptyPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });

        it(`#03 Should get user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${emptyPermission}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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
        });

        afterEach(async () => {
          await membershipsPrisma.removeAll();
        });
      });

      describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = readPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });

        it(`#04 Should get user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${readPermission}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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
          expect(membershipFromResponse).toHaveProperty('permissions', readPermission);
          expect(membershipFromResponse).toHaveProperty('locked', false);
        });
      });

      describe(`Get membership with permission [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = allPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });

        it(`#05 Should get user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${allPermission}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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
          expect(membershipFromResponse).toHaveProperty('permissions', allPermission);
          expect(membershipFromResponse).toHaveProperty('locked', false);
        });
      });
      afterEach(async () => {
        await membershipsPrisma.removeAll();
      });
    });
    describe(`As user with permission [${readPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = ['memberships:read'];
        await membershipsPrisma.create({ data: membershipUserManagerTest });
      });

      describe(`Get membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = emptyPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });

        it(`#06 Should get user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${emptyPermission}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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
        });
      });

      describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = readPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });

        it(`#07 Should get user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${readPermission}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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
          expect(membershipFromResponse).toHaveProperty('permissions', readPermission);
          expect(membershipFromResponse).toHaveProperty('locked', false);
        });
      });

      describe(`Get membership with permission [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = allPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });

        it(`#08 Should get user [${userTest.username}] in institution [${institutionTest.name}] with permissions [${allPermission}]`, async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/institutions/${institutionId}/memberships/${userTest.username}`,
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
          expect(membershipFromResponse).toHaveProperty('permissions', allPermission);
          expect(membershipFromResponse).toHaveProperty('locked', false);
        });
      });
      afterEach(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });
  describe('With random token', () => {
    describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = readPermission;
        await membershipsPrisma.create({ data: membershipUserTest });
      });

      it(`#09 Should not get membership of user [${userTest.username}] for institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = readPermission;
        await membershipsPrisma.create({ data: membershipUserTest });
      });

      it(`#10 Should not get membership of user [${userTest.username}] for institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/institutions/${institutionId}/memberships/${userTest.username}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
      });
    });
  });

  afterAll(async () => {
    await resetDatabase();
  });
});
