const ezmesure = require('../../setup/ezmesure');

const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');

const { createInstitution } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');
const { resetDatabase } = require('../../../lib/services/prisma/utils');

describe('[institutions]: Test validate institution features', () => {
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
    it(`#01 Should validate institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}/validated`,
        data: { value: true },
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);

      const institutionFromResponse = httpAppResponse?.data;
      expect(institutionFromResponse).toHaveProperty('validated', true);

      // Test service
      const institutionFromService = await institutionsService.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', true);
    });

    // TODO start with invalidate institution
    it(`#02 Should invalidate institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}/validated`,
        data: { value: false },
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);

      const institutionFromResponse = httpAppResponse?.data;
      expect(institutionFromResponse).toHaveProperty('validated', false);

      // Test service
      const institutionFromService = await institutionsService.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', false);
    });

    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });
  describe('As user', () => {
    let userToken;
    let userTest;
    beforeAll(async () => {
      // TODO use service to create user
      userTest = await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });
    let institutionId;
    describe('Institution created by user', () => {
      beforeAll(async () => {
        // TODO use service to create institution
        institutionId = await createInstitution(institutionTest, userTest);
      });

      it(`#03 Should not validate institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/validated`,
          data: { value: true },
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Test service
        const institutionFromService = await institutionsService.findByID(institutionId);
        expect(institutionFromService).toHaveProperty('validated', false);
      });

      // TODO start with invalidate institution

      it(`#04 Should not invalidate institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/validated`,
          data: { value: true },
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Test service
        const institutionFromService = await institutionsService.findByID(institutionId);
        expect(institutionFromService).toHaveProperty('validated', false);
      });
    });

    describe('Institution created by other', () => {
      it(`#05 Should not validate institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/validated`,
          data: { value: true },
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Test service
        const institutionFromService = await institutionsService.findByID(institutionId);
        expect(institutionFromService).toHaveProperty('validated', false);
      });

      // TODO start with invalidate institution

      it(`#06 Should not invalidate institution [${institutionTest.name}]`, async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/institutions/${institutionId}/validated`,
          data: { value: false },
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Test service
        const institutionFromService = await institutionsService.findByID(institutionId);
        expect(institutionFromService).toHaveProperty('validated', false);
      });
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
    it(`#07 Should not validate institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}`,
        data: { value: true },
        headers: {
          Authorization: 'Bearer: random',
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institutionFromService = await institutionsService.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', false);
    });

    // TODO start with invalidate institution
    it(`#08 Should not invalidate institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}`,
        data: { value: false },
        headers: {
          Authorization: 'Bearer: random',
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institutionFromService = await institutionsService.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', false);
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
    it(`#09 Should not validate institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}`,
        data: { value: true },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institutionFromService = await institutionsService.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', false);
    });

    // TODO start with invalidate institution
    it(`#10 Should not invalidate institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}`,
        data: { value: false },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institutionFromService = await institutionsService.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', false);
    });

    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });
  afterAll(async () => {
    await resetDatabase();
  });
});
