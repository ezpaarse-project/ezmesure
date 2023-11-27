const ezmesure = require('../../setup/ezmesure');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getAdminToken, getToken } = require('../../setup/login');

describe('[institutions]: Test delete features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };
  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });
  describe('As admin', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#01 DELETE /institutions/:institutionId - Should delete institution [${institutionTest.name}]`, async () => {
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
      await institutionsService.deleteAll();
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

    it(`#02 DELETE /institutions/:institutionId - Should delete institution [${institutionTest.name}]`, async () => {
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

      expect(institution?.id).not.toBeNull();
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
      await institutionsService.deleteAll();
      await usersService.deleteAll();
    });
  });
  describe('With random token', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#03 DELETE /institutions/:institutionId - Should not delete institution [${institutionTest.name}]`, async () => {
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
      await institutionsService.deleteAll();
    });
  });
  describe('Without token', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#04 DELETE /institutions/:institutionId - Should not delete institution [${institutionTest.name}]`, async () => {
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
      await institutionsService.deleteAll();
    });
  });
});
