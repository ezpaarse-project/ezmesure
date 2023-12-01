const ezmesure = require('../../setup/ezmesure');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createInstitution } = require('../../setup/institutions');

const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test update features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  const updateInstitutionTest = {
    name: 'Test2',
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

    it(`#01 Should update institution [${institutionTest.name}] to [${updateInstitutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}`,
        data: updateInstitutionTest,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);

      const institutionFromResponse = httpAppResponse?.data;
      expect(institutionFromResponse).toHaveProperty('id', institutionId);
      expect(institutionFromResponse).toHaveProperty('parentInstitutionId', null);
      expect(institutionFromResponse?.createdAt).not.toBeNull();
      expect(institutionFromResponse?.updatedAt).not.toBeNull();
      expect(institutionFromResponse).toHaveProperty('name', updateInstitutionTest.name);
      expect(institutionFromResponse).toHaveProperty('namespace', institutionTest.namespace);
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

      // Test service
      const institutionFromService = await institutionsService.findByID(institutionId);

      expect(institutionFromService).toHaveProperty('id', institutionId);
      expect(institutionFromService).toHaveProperty('parentInstitutionId', null);
      expect(institutionFromService?.createdAt).not.toBeNull();
      expect(institutionFromService?.updatedAt).not.toBeNull();
      expect(institutionFromService).toHaveProperty('name', updateInstitutionTest.name);
      expect(institutionFromService).toHaveProperty('namespace', institutionTest.namespace);
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
      await institutionsService.removeAll();
    });
  });
  describe('As user', () => {
    let userToken;
    let userTest;
    let institutionId;
    beforeAll(async () => {
      // TODO use service to create user
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });
    describe('Institution created by user', () => {
      beforeAll(async () => {
        // TODO user service to create institution by user
        institutionId = await createInstitution(institutionTest, userTest);
      });

      it(`#02 Should update institution [${institutionTest.name}] to [${updateInstitutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}`,
          data: updateInstitutionTest,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const institutionFromResponse = httpAppResponse?.data;
        expect(institutionFromResponse).toHaveProperty('id', institutionId);
        expect(institutionFromResponse).toHaveProperty('parentInstitutionId', null);
        expect(institutionFromResponse?.createdAt).not.toBeNull();
        expect(institutionFromResponse?.updatedAt).not.toBeNull();
        expect(institutionFromResponse).toHaveProperty('name', updateInstitutionTest.name);
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

        // Test service
        const institutionFromService = await institutionsService.findByID(institutionId);

        expect(institutionFromService).toHaveProperty('id', institutionId);
        expect(institutionFromService).toHaveProperty('parentInstitutionId', null);
        expect(institutionFromService?.createdAt).not.toBeNull();
        expect(institutionFromService?.updatedAt).not.toBeNull();
        expect(institutionFromService).toHaveProperty('name', updateInstitutionTest.name);
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
        await institutionsService.removeAll();
      });
    });

    describe('Institution created by other', () => {
      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);

        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      it(`#03 Should not update institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}`,
          data: updateInstitutionTest,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Test service
        const institution = await institutionsService.findByID(institutionId);

        expect(institution).toHaveProperty('id', institutionId);
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
      });
    });
    afterAll(async () => {
      await usersService.removeAll();
    });
  });
  describe('With random token', () => {
    let institutionId;
    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#04 Should not update institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}`,
        headers: {
          Authorization: 'Bearer: random',
        },
        data: updateInstitutionTest,
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institution = await institutionsService.findByID(institutionId);

      expect(institution).toHaveProperty('id', institutionId);
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
    });
  });
  describe('Without token', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it(`#05 Should not update institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}`,
        data: updateInstitutionTest,
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institution = await institutionsService.findByID(institutionId);

      expect(institution).toHaveProperty('id', institutionId);
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
    });
  });
});
