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

describe('[institutions]: Test delete features', () => {
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

    beforeAll(async () => {
      const institution = await institutionsPrisma.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#01 Should delete institution [${institutionTest.name}]`, async () => {
      const res = await ezmesure({
        method: 'DELETE',
        url: `/institutions/${institutionId}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      // Test API
      expect(res).toHaveProperty('status', 200);

      // Test service
      const institution = await institutionsPrisma.findByID(institutionId);
      expect(institution).toEqual(null);
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
      const institution = await institutionsPrisma.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#02 Should delete institution [${institutionTest.name}]`, async () => {
      const res = await ezmesure({
        method: 'DELETE',
        url: `/institutions/${institutionId}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      // Test API
      expect(res).toHaveProperty('status', 403);

      // Test service
      const institution = await institutionsPrisma.findByID(institutionId);

      expect(institution).toHaveProperty('parentInstitutionId', null);
      expect(institution?.createdAt).not.toBeNull();
      expect(institution?.updatedAt).not.toBeNull();
      expect(institution).toHaveProperty('name', institutionTest.name);
      expect(institution).toHaveProperty('namespace', null);
      expect(institution).toHaveProperty('validated', false);
      expect(institution).toHaveProperty('hidePartner', false);
      expect(institution).toHaveProperty('tags', []);
      expect(institution).toHaveProperty('logoId', null);
      expect(institution).toHaveProperty('type', null);
      expect(institution).toHaveProperty('acronym', null);
      expect(institution).toHaveProperty('websiteUrl', null);
      expect(institution).toHaveProperty('city', null);
      expect(institution).toHaveProperty('uai', null);
      expect(institution).toHaveProperty('social', null);
      expect(institution).toHaveProperty('sushiReadySince', null);
    });

    afterAll(async () => {
      await institutionsPrisma.removeAll();
      await usersPrisma.removeAll();
    });
  });
  describe('With random token', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsPrisma.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#03 Should not delete institution [${institutionTest.name}]`, async () => {
      const res = await ezmesure({
        method: 'DELETE',
        url: `/institutions/${institutionId}`,
        headers: {
          Authorization: 'Bearer: random',
        },
      });
      // Test API
      expect(res).toHaveProperty('status', 401);

      // Test service
      const institution = await institutionsPrisma.findByID(institutionId);
      expect(institution).not.toBeNull();
    });

    afterAll(async () => {
      await institutionsPrisma.removeAll();
    });
  });
  describe('Without token', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsPrisma.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#04 Should not delete institution [${institutionTest.name}]`, async () => {
      const res = await ezmesure({
        method: 'DELETE',
        url: `/institutions/${institutionId}`,
      });
      expect(res).toHaveProperty('status', 401);

      // Test service
      const institution = await institutionsPrisma.findByID(institutionId);
      expect(institution).not.toBeNull();
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
