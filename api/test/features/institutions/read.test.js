const ezmesure = require('../../setup/ezmesure');
const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const {
  createDefaultActivatedUserAsAdmin,
} = require('../../setup/users');

const { getToken, getAdminToken } = require('../../setup/login');

describe('[institutions]: Test read features', () => {
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

    beforeEach(async () => {
      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it('#01 Should get all institutions', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: '/institutions',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);

      const institutions = httpAppResponse?.data[0];
      expect(institutions).toHaveProperty('id', institutionId);
      expect(institutions).toHaveProperty('parentInstitutionId', null);
      expect(institutions?.createdAt).not.toBeNull();
      expect(institutions?.updatedAt).not.toBeNull();
      expect(institutions).toHaveProperty('name', institutionTest.name);
      expect(institutions).toHaveProperty('namespace', 'test');
      expect(institutions).toHaveProperty('validated', false);
      expect(institutions).toHaveProperty('hidePartner', false);
      expect(institutions).toHaveProperty('tags', []);
      expect(institutions).toHaveProperty('logoId', null);
      expect(institutions).toHaveProperty('type', null);
      expect(institutions).toHaveProperty('acronym', null);
      expect(institutions).toHaveProperty('websiteUrl', null);
      expect(institutions).toHaveProperty('city', null);
      expect(institutions).toHaveProperty('uai', null);
      expect(institutions).toHaveProperty('social', null);
      expect(institutions).toHaveProperty('sushiReadySince', null);
    });

    it(`#02 Should get institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/institutions/${institutionId}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);

      const institution = httpAppResponse?.data;
      expect(institution).toHaveProperty('id', institutionId);
      expect(institution).toHaveProperty('parentInstitutionId', null);
      expect(institution?.createdAt).not.toBeNull();
      expect(institution?.updatedAt).not.toBeNull();
      expect(institution).toHaveProperty('name', institutionTest.name);
      expect(institution).toHaveProperty('namespace', 'test');
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

    afterEach(async () => {
      await institutionsService.removeAll();
    });
  });
  describe('As user', () => {
    let userToken;
    let userTest;
    let institutionId;

    beforeEach(async () => {
      // TODO use service to create user
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);

      const institution = await institutionsService.create({ data: institutionTest });
      institutionId = institution.id;
    });

    it('#03 Should get all institutions', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: '/institutions',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);

      const institutions = httpAppResponse?.data[0];

      expect(institutions).toHaveProperty('id', institutionId);
      expect(institutions).toHaveProperty('parentInstitutionId', null);
      expect(institutions?.createdAt).not.toBeNull();
      expect(institutions?.updatedAt).not.toBeNull();
      expect(institutions).toHaveProperty('name', institutionTest.name);
      expect(institutions).toHaveProperty('namespace', 'test');
      expect(institutions).toHaveProperty('validated', false);
      expect(institutions).toHaveProperty('hidePartner', false);
      expect(institutions).toHaveProperty('tags', []);
      expect(institutions).toHaveProperty('logoId', null);
      expect(institutions).toHaveProperty('type', null);
      expect(institutions).toHaveProperty('acronym', null);
      expect(institutions).toHaveProperty('websiteUrl', null);
      expect(institutions).toHaveProperty('city', null);
      expect(institutions).toHaveProperty('uai', null);
      expect(institutions).toHaveProperty('social', null);
      expect(institutions).toHaveProperty('sushiReadySince', null);
    });

    it(`#04 GET Should get institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/institutions/${institutionId}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 200);

      const institutions = httpAppResponse?.data;
      expect(institutions).toHaveProperty('id', institutionId);
      expect(institutions).toHaveProperty('parentInstitutionId', null);
      expect(institutions?.createdAt).not.toBeNull();
      expect(institutions?.updatedAt).not.toBeNull();
      expect(institutions).toHaveProperty('name', institutionTest.name);
      expect(institutions).toHaveProperty('namespace', institutionTest.namespace);
      expect(institutions).toHaveProperty('validated', false);
      expect(institutions).toHaveProperty('hidePartner', false);
      expect(institutions).toHaveProperty('tags', []);
      expect(institutions).toHaveProperty('logoId', null);
      expect(institutions).toHaveProperty('type', null);
      expect(institutions).toHaveProperty('acronym', null);
      expect(institutions).toHaveProperty('websiteUrl', null);
      expect(institutions).toHaveProperty('city', null);
      expect(institutions).toHaveProperty('uai', null);
      expect(institutions).toHaveProperty('social', null);
      expect(institutions).toHaveProperty('sushiReadySince', null);
    });

    afterEach(async () => {
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

    it('#05 Should not get all institutions', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: '/institutions',
        headers: {
          Authorization: 'Bearer: random',
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    it(`#06 Should not get institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/institutions/${institutionId}`,
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
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

    it('#07 Should not get all institutions', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: '/institutions',
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    it(`#08 Should not get institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/institutions/${institutionId}`,
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });
});
