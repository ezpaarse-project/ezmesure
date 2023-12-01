const ezmesure = require('../../../setup/ezmesure');

const institutionsService = require('../../../../lib/entities/institutions.service');
const membershipsService = require('../../../../lib/entities/memberships.service');
const usersService = require('../../../../lib/entities/users.service');

const { createUserAsAdmin, activateUser } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');

describe('[institutions - memberships]: Test read memberships features', () => {
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
    describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = readPermission;
        await membershipsService.create({ data: membershipUserTest });
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
        await membershipsService.removeAll();
      });
    });

    describe(`Get membership with permissions [${allPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = allPermission;
        await membershipsService.create({ data: membershipUserTest });
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
        await membershipsService.removeAll();
      });
    });
  });
  describe('As user', () => {
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
      userManagerToken = await getToken(userManagerTest.username, userManagerTest.password);
    });
    describe(`As user with permission [${allPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = allPermission;
        await membershipsService.create({ data: membershipUserManagerTest });
      });

      describe(`Get membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeEach(async () => {
          membershipUserTest.permissions = emptyPermission;
          await membershipsService.create({ data: membershipUserTest });
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
          await membershipsService.removeAll();
        });
      });

      describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = readPermission;
          await membershipsService.create({ data: membershipUserTest });
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
          await membershipsService.create({ data: membershipUserTest });
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
        await membershipsService.removeAll();
      });
    });
    describe(`As user with permission [${readPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = ['memberships:read'];
        await membershipsService.create({ data: membershipUserManagerTest });
      });

      describe(`Get membership with permission [${emptyPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
        beforeAll(async () => {
          membershipUserTest.permissions = emptyPermission;
          await membershipsService.create({ data: membershipUserTest });
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
          await membershipsService.create({ data: membershipUserTest });
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
          await membershipsService.create({ data: membershipUserTest });
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
        await membershipsService.removeAll();
      });
    });
  });
  describe('With random token', () => {
    describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = readPermission;
        await membershipsService.create({ data: membershipUserTest });
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
        await membershipsService.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe(`Get membership with permission [${readPermission}] of user [${userTest.username}] for institution [${institutionTest.name}]`, () => {
      beforeAll(async () => {
        membershipUserTest.permissions = readPermission;
        await membershipsService.create({ data: membershipUserTest });
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
        await membershipsService.removeAll();
      });
    });
  });

  afterAll(async () => {
    await usersService.removeAll();
    await institutionsService.removeAll();
  });
});
