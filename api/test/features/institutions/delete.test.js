const ezmesure = require('../../setup/ezmesure');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getAdminToken, getToken } = require('../../setup/login');
const { resetDatabase } = require('../../../lib/services/prisma/utils');

describe('[institutions]: Test delete features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };
  let adminToken;

  beforeAll(async () => {
    await resetDatabase();
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
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
      const institution = await institutionsService.findByID(institutionId);
      expect(institution).toEqual(null);
    });

    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });
  describe('As user', () => {
    let userTest;
    let userToken;
    let institutionId;
    beforeAll(async () => {
      // TODO use service to create user
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
      const institution = await institutionsService.create({ data: institutionTest });
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
      const institution = await institutionsService.findByID(institutionId);

      expect(institution).toHaveProperty('parentInstitutionId', null);
      expect(institution?.createdAt).not.toBeNull();
      expect(institution?.updatedAt).not.toBeNull();
      expect(institution).toHaveProperty('name', institutionTest.name);
      expect(institution).toHaveProperty('namespace', institutionTest.namespace);
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
      await institutionsService.removeAll();
      await usersService.removeAll();
    });
  });
  describe('With random token', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
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
      const institution = await institutionsService.findByID(institutionId);
      expect(institution).not.toBeNull();
    });

    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });
  describe('Without token', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#04 Should not delete institution [${institutionTest.name}]`, async () => {
      const res = await ezmesure({
        method: 'DELETE',
        url: `/institutions/${institutionId}`,
      });
      expect(res).toHaveProperty('status', 401);

      // Test service
      const institution = await institutionsService.findByID(institutionId);
      expect(institution).not.toBeNull();
    });

    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });
  afterAll(async () => {
    await resetDatabase();
  });
});
