import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import institutionsPrisma from '../../../lib/services/prisma/institutions';
import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';
import UsersService from '../../../lib/entities/users.service';

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[institutions]: Test create features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const institutionTest = {
    name: 'Test',
  };

  let adminToken;

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await (new UsersService()).generateToken(adminUsername, adminPassword);
  });

  describe('As admin', () => {
    let institutionId;
    it(`#01 Should create new institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/institutions',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: institutionTest,
      });

      institutionId = httpAppResponse?.data?.id;

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 201);

      const institutionFromResponse = httpAppResponse?.data;

      expect(institutionFromResponse).toHaveProperty('parentInstitutionId', null);
      expect(institutionFromResponse?.createdAt).not.toBeNull();
      expect(institutionFromResponse?.updatedAt).not.toBeNull();
      expect(institutionFromResponse).toHaveProperty('name', institutionTest.name);
      expect(institutionFromResponse).toHaveProperty('namespace', null);
      expect(institutionFromResponse).toHaveProperty('validated', false);
      expect(institutionFromResponse).toHaveProperty('hidePartner', false);
      expect(institutionFromResponse).toHaveProperty('tags', []);
      expect(institutionFromResponse).toHaveProperty('logoId', null);
      expect(institutionFromResponse).toHaveProperty('type', null);
      expect(institutionFromResponse).toHaveProperty('acronym', null);
      expect(institutionFromResponse).toHaveProperty('websiteUrl', null);
      expect(institutionFromResponse).toHaveProperty('city', null);
      expect(institutionFromResponse).toHaveProperty('uai', null);
      expect(institutionFromResponse).toHaveProperty('social', null);
      expect(institutionFromResponse).toHaveProperty('sushiReadySince', null);

      // Test institution service
      const institutionFromService = await institutionsPrisma.findByID(institutionId);

      expect(institutionFromService).toHaveProperty('id', institutionId);
      expect(institutionFromService).toHaveProperty('parentInstitutionId', null);
      expect(institutionFromService?.createdAt).not.toBeNull();
      expect(institutionFromService?.updatedAt).not.toBeNull();
      expect(institutionFromService).toHaveProperty('name', institutionTest.name);
      expect(institutionFromService).toHaveProperty('namespace', null);
      expect(institutionFromService).toHaveProperty('validated', false);
      expect(institutionFromService).toHaveProperty('hidePartner', false);
      expect(institutionFromService).toHaveProperty('tags', []);
      expect(institutionFromService).toHaveProperty('logoId', null);
      expect(institutionFromService).toHaveProperty('type', null);
      expect(institutionFromService).toHaveProperty('acronym', null);
      expect(institutionFromService).toHaveProperty('websiteUrl', null);
      expect(institutionFromService).toHaveProperty('city', null);
      expect(institutionFromService).toHaveProperty('uai', null);
      expect(institutionFromService).toHaveProperty('social', null);
      expect(institutionFromService).toHaveProperty('sushiReadySince', null);
    });

    afterAll(async () => {
      await institutionsPrisma.removeAll();
    });
  });
  describe('As user', () => {
    let userToken;
    let institutionId;

    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await (new UsersService()).generateToken(userTest.username, userTest.password);
    });
    it(`#02 Should create new institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/institutions',
        data: institutionTest,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      institutionId = httpAppResponse?.data?.id;
      expect(httpAppResponse).toHaveProperty('status', 201);

      // Test service
      const institutionFromService = await institutionsPrisma.findByID(
        institutionId,
        { memberships: true },
      );

      expect(institutionFromService).toHaveProperty('id', institutionId);
      expect(institutionFromService).toHaveProperty('parentInstitutionId', null);
      expect(institutionFromService?.createdAt).not.toBeNull();
      expect(institutionFromService?.updatedAt).not.toBeNull();
      expect(institutionFromService).toHaveProperty('name', institutionTest.name);
      expect(institutionFromService).toHaveProperty('namespace', null);
      expect(institutionFromService).toHaveProperty('validated', false);
      expect(institutionFromService).toHaveProperty('hidePartner', false);
      expect(institutionFromService).toHaveProperty('tags', []);
      expect(institutionFromService).toHaveProperty('logoId', null);
      expect(institutionFromService).toHaveProperty('type', null);
      expect(institutionFromService).toHaveProperty('acronym', null);
      expect(institutionFromService).toHaveProperty('websiteUrl', null);
      expect(institutionFromService).toHaveProperty('city', null);
      expect(institutionFromService).toHaveProperty('uai', null);
      expect(institutionFromService).toHaveProperty('social', null);
      expect(institutionFromService).toHaveProperty('sushiReadySince', null);

      const memberships = institutionFromService?.memberships[0];
      expect(memberships).toHaveProperty('username', 'user.test');
      expect(memberships).toHaveProperty('institutionId', institutionId);
      expect(memberships).toHaveProperty('locked', true);

      const { permissions } = memberships;
      const { roles } = memberships;

      const defaultPermissions = [
        'institution:read',
        'institution:write',
        'memberships:read',
        'memberships:write',
        'sushi:read',
        'sushi:write',
        'reporting:read',
        'reporting:write',
      ];

      const defaultRoles = ['contact:doc', 'contact:tech'];

      expect(permissions.sort()).toEqual(defaultPermissions.sort());
      expect(roles.sort()).toEqual(defaultRoles.sort());
    });

    afterAll(async () => {
      await institutionsPrisma.removeAll();
      await usersPrisma.removeAll();
    });
  });
  describe('With random token', () => {
    it(`#03 Should no create institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/institutions',
        data: institutionTest,
        headers: {
          Authorization: 'Bearer: random',
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institutions = await institutionsPrisma.findMany();
      expect(institutions).toEqual([]);
    });

    afterAll(async () => {
      await institutionsPrisma.removeAll();
    });
  });
  describe('Without token', () => {
    it(`#04 Should no create institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'POST',
        url: '/institutions',
        data: institutionTest,
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institutionsFromService = await institutionsPrisma.findMany();
      expect(institutionsFromService).toEqual([]);
    });

    afterAll(async () => {
      await institutionsPrisma.removeAll();
    });
  });

  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
