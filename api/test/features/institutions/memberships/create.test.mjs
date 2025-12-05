import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import config from 'config';

import ezmesure from '../../../setup/ezmesure';

import institutionsPrisma from '../../../../lib/services/prisma/institutions';
import membershipsPrisma from '../../../../lib/services/prisma/memberships';
import usersPrisma from '../../../../lib/services/prisma/users';
import usersElastic from '../../../../lib/services/elastic/users';
import UsersService from '../../../../lib/entities/users.service';

import { resetDatabase } from '../../../../lib/services/prisma/utils';
import { resetElastic } from '../../../../lib/services/elastic/utils';

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[institutions - memberships]: Test create memberships features', () => {
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
    adminToken = await (new UsersService()).generateToken(adminUsername, adminPassword);

    const institution = await institutionsPrisma.create({ data: institutionTest });
    institutionId = institution.id;

    membershipUserManagerTest.institutionId = institutionId;

    await usersPrisma.create({ data: userTest });
    await usersElastic.createUser(userTest);
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
        expect(membershipFromResponse).toHaveProperty('permissions', readPermission);
        expect(membershipFromResponse).toHaveProperty('locked', false);

        // Test service
        const membershipFromService = await membershipsPrisma
          .findByID(institutionId, userTest.username);

        expect(membershipFromService).toHaveProperty('username', userTest.username);
        expect(membershipFromService).toHaveProperty('institutionId', institutionId);
        expect(membershipFromService).toHaveProperty('permissions', readPermission);
        expect(membershipFromService).toHaveProperty('locked', false);

        // TODO test institutionsPrisma
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
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
        expect(membershipFromResponse).toHaveProperty('permissions', allPermission);
        expect(membershipFromResponse).toHaveProperty('locked', false);

        // Test service
        const membershipFromService = await membershipsPrisma
          .findByID(institutionId, userTest.username);

        expect(membershipFromService).toHaveProperty('username', userTest.username);
        expect(membershipFromService).toHaveProperty('institutionId', institutionId);
        expect(membershipFromService).toHaveProperty('permissions', allPermission);
        expect(membershipFromService).toHaveProperty('locked', false);

        // TODO test institutionsPrisma
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

      userManagerToken = await (new UsersService())
        .generateToken(userManagerTest.username, userManagerPassword);
    });
    describe(`With permission [${allPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = allPermission;
        await membershipsPrisma.create({ data: membershipUserManagerTest });
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
          expect(membershipFromResponse).toHaveProperty('permissions', emptyPermission);
          expect(membershipFromResponse).toHaveProperty('locked', false);

          // Test service
          const membershipFromService = await membershipsPrisma
            .findByID(institutionId, userTest.username);

          expect(membershipFromService).toHaveProperty('username', userTest.username);
          expect(membershipFromService).toHaveProperty('institutionId', institutionId);
          expect(membershipFromService).toHaveProperty('permissions', emptyPermission);
          expect(membershipFromService).toHaveProperty('locked', false);

          // TODO test institutionsPrisma
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
          const membership = await membershipsPrisma.findByID(institutionId, userTest.username);

          expect(membership).toHaveProperty('username', userTest.username);
          expect(membership).toHaveProperty('institutionId', institutionId);
          expect(membership).toHaveProperty('permissions', readPermission);
          expect(membership).toHaveProperty('locked', false);

          // TODO test institutionsPrisma
        });
      });
      afterEach(async () => {
        await membershipsPrisma.removeAll();
      });
    });
    describe(`With permission [${readPermission}]`, () => {
      beforeEach(async () => {
        membershipUserManagerTest.permissions = readPermission;
        await membershipsPrisma.create({ data: membershipUserManagerTest });
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
          const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
          expect(membership).toEqual(null);

          // TODO test institutionsPrisma
        });
      });

      afterEach(async () => {
        await membershipsPrisma.removeAll();
      });
    });
    afterAll(async () => {
      await usersPrisma.removeAll();
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
        const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
        expect(membership).toEqual(null);

        // TODO test institutionsPrisma
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
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
        const membership = await membershipsPrisma.findByID(institutionId, userTest.username);
        expect(membership).toEqual(null);

        // TODO test institutionsPrisma
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
