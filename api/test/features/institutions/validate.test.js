const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const institutionsPrisma = require('../../../lib/services/prisma/institutions');
const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const usersService = require('../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[institutions]: Test validate institution features', () => {
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
    adminToken = await usersService.generateToken(adminUsername, adminPassword);
  });

  describe('As admin', () => {
    let institutionId;

    beforeAll(async () => {
      const institution = await institutionsPrisma.create({ data: institutionTest });
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
      const institutionFromService = await institutionsPrisma.findByID(institutionId);
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
      const institutionFromService = await institutionsPrisma.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', false);
    });

    afterAll(async () => {
      await institutionsPrisma.removeAll();
    });
  });
  describe('As user', () => {
    let userToken;
    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await usersService.generateToken(userTest.username, userTest.password);
    });
    let institutionId;
    describe('Institution created by user', () => {
      beforeAll(async () => {
        const institution = await institutionsPrisma
          .createAsUser(institutionTest, userTest.username);
        institutionId = institution.id;
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
        const institutionFromService = await institutionsPrisma.findByID(institutionId);
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
        const institutionFromService = await institutionsPrisma.findByID(institutionId);
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
        const institutionFromService = await institutionsPrisma.findByID(institutionId);
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
        const institutionFromService = await institutionsPrisma.findByID(institutionId);
        expect(institutionFromService).toHaveProperty('validated', false);
      });
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
      const institutionFromService = await institutionsPrisma.findByID(institutionId);
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
      const institutionFromService = await institutionsPrisma.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', false);
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
    it(`#09 Should not validate institution [${institutionTest.name}]`, async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institutionId}`,
        data: { value: true },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Test service
      const institutionFromService = await institutionsPrisma.findByID(institutionId);
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
      const institutionFromService = await institutionsPrisma.findByID(institutionId);
      expect(institutionFromService).toHaveProperty('validated', false);
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
