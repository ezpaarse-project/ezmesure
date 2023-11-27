const ezmesure = require('../../setup/ezmesure');

const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');
const sushiEndpointsService = require('../../../lib/entities/sushi-endpoint.service');
const sushiCredentialsService = require('../../../lib/entities/sushi-credentials.service');
const membershipsService = require('../../../lib/entities/memberships.service');

const {
  createInstitution,
} = require('../../setup/institutions');

const {
  createDefaultActivatedUserAsAdmin,
  createUserAsAdmin,
  activateUser,
} = require('../../setup/users');

const { getToken, getAdminToken } = require('../../setup/login');

describe('[sushi]: Test read sushi features', () => {
  const allPermission = ['sushi:write', 'sushi:read'];
  const readPermission = ['sushi:read'];
  const emptyPermission = [];

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

  const anotherUserTest = {
    username: 'another.user',
    email: 'another.user@test.fr',
    fullName: 'Another user',
    isAdmin: false,
    password: 'changeme',
    permissions: ['memberships:write', 'memberships:read'],
  };

  const sushiEndpointTest = {
    sushiUrl: 'http://localhost',
    vendor: 'test vendor',
    description: 'test description',
    counterVersion: '5.0.0',
    technicalProvider: 'test technicalProvider',
    requireCustomerId: true,
    requireRequestorId: true,
    requireApiKey: true,
    ignoreReportValidation: true,
    defaultCustomerId: 'test defaultCustomerId',
    defaultRequestorId: 'test defaultRequestorId',
    defaultApiKey: 'defaultApiKey',
    paramSeparator: ',',
    tags: [],
  };

  const sushiTest = {
    endpointId: '',
    institutionId: '',
    customerId: 'customerId test',
    requestorId: 'requestorId test',
    apiKey: 'apikey test',
    comment: 'comment test',
    tags: [],
    params: [],
  };

  let sushiEndpointId;
  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const sushiEndpoint = await sushiEndpointsService.create({ data: sushiEndpointTest });
    sushiEndpointId = sushiEndpoint.id;
  });
  describe('As admin', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('GET /sushi/<id> - Get sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#01 Should get sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          const sushiFromResponse = httpAppResponse?.data;
          expect(sushiFromResponse).toHaveProperty('id', sushiId);
          expect(sushiFromResponse?.createdAt).not.toBeNull();
          expect(sushiFromResponse?.updatedAt).not.toBeNull();
          expect(sushiFromResponse).toHaveProperty('institutionId', sushiTest?.institutionId);
          expect(sushiFromResponse).toHaveProperty('endpointId', sushiTest?.endpointId);
          expect(sushiFromResponse).toHaveProperty('customerId', sushiTest?.customerId);
          expect(sushiFromResponse).toHaveProperty('requestorId', sushiTest?.requestorId);
          expect(sushiFromResponse).toHaveProperty('apiKey', sushiTest?.apiKey);
          expect(sushiFromResponse).toHaveProperty('comment', sushiTest?.comment);
          expect(sushiFromResponse).toHaveProperty('tags', sushiTest?.tags);
          expect(sushiFromResponse).toHaveProperty('params', sushiTest?.params);
          expect(sushiFromResponse?.endpoint).not.toBeNull();
        });

        afterAll(async () => {
          await sushiCredentialsService.deleteAll();
        });
      });

      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });
    describe('Institution created by user', () => {
      let institutionId;
      beforeAll(async () => {
        await createDefaultActivatedUserAsAdmin();
        institutionId = await createInstitution(institutionTest, userTest);
      });

      describe('GET /sushi/<id> - Get sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#02 Should get sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          const sushiFromResponse = httpAppResponse?.data;
          expect(sushiFromResponse).toHaveProperty('id', sushiId);
          expect(sushiFromResponse?.createdAt).not.toBeNull();
          expect(sushiFromResponse?.updatedAt).not.toBeNull();
          expect(sushiFromResponse).toHaveProperty('institutionId', sushiTest?.institutionId);
          expect(sushiFromResponse).toHaveProperty('endpointId', sushiTest?.endpointId);
          expect(sushiFromResponse).toHaveProperty('customerId', sushiTest?.customerId);
          expect(sushiFromResponse).toHaveProperty('requestorId', sushiTest?.requestorId);
          expect(sushiFromResponse).toHaveProperty('apiKey', sushiTest?.apiKey);
          expect(sushiFromResponse).toHaveProperty('comment', sushiTest?.comment);
          expect(sushiFromResponse).toHaveProperty('tags', sushiTest?.tags);
          expect(sushiFromResponse).toHaveProperty('params', sushiTest?.params);
          expect(sushiFromResponse?.endpoint).not.toBeNull();
        });

        afterAll(async () => {
          await sushiCredentialsService.deleteAll();
        });
      });

      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });
  });
  describe('As user', () => {
    let userToken;

    beforeAll(async () => {
      await createDefaultActivatedUserAsAdmin();
      userToken = await getToken(userTest.username, userTest.password);
    });

    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });
      describe('GET /sushi/<id> - Get sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#03 Should not get sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);
        });

        afterAll(async () => {
          await sushiCredentialsService.deleteAll();
        });
      });

      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });
    describe('Institution created by user', () => {
      let institutionId;
      beforeAll(async () => {
        institutionId = await createInstitution(institutionTest, userTest);
        await institutionsService.validate(institutionId);
      });

      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = allPermission;
          // FIXME membership create by function createInstitution
          // await membershipsService.create({ data: membershipUserTest });
        });
        describe('GET /sushi/<id> - Get sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#04 Should get sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'GET',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 200);

            const sushiFromResponse = httpAppResponse?.data;
            expect(sushiFromResponse).toHaveProperty('id', sushiId);
            expect(sushiFromResponse?.createdAt).not.toBeNull();
            expect(sushiFromResponse?.updatedAt).not.toBeNull();
            expect(sushiFromResponse).toHaveProperty('institutionId', sushiTest?.institutionId);
            expect(sushiFromResponse).toHaveProperty('endpointId', sushiTest?.endpointId);
            expect(sushiFromResponse).toHaveProperty('customerId', sushiTest?.customerId);
            expect(sushiFromResponse).toHaveProperty('requestorId', sushiTest?.requestorId);
            expect(sushiFromResponse).toHaveProperty('apiKey', sushiTest?.apiKey);
            expect(sushiFromResponse).toHaveProperty('comment', sushiTest?.comment);
            expect(sushiFromResponse).toHaveProperty('tags', sushiTest?.tags);
            expect(sushiFromResponse).toHaveProperty('params', sushiTest?.params);
            expect(sushiFromResponse?.endpoint).not.toBeNull();
          });

          afterAll(async () => {
            await sushiCredentialsService.deleteAll();
          });
        });
        afterAll(async () => {
          await membershipsService.deleteAll();
        });
      });

      describe(`User with memberships [${readPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = readPermission;
          await membershipsService.create({ data: membershipUserTest });
        });
        describe('GET /sushi/<id> - Get sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#05 Should get sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'GET',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 200);

            const sushiFromResponse = httpAppResponse?.data;
            expect(sushiFromResponse).toHaveProperty('id', sushiId);
            expect(sushiFromResponse?.createdAt).not.toBeNull();
            expect(sushiFromResponse?.updatedAt).not.toBeNull();
            expect(sushiFromResponse).toHaveProperty('institutionId', sushiTest?.institutionId);
            expect(sushiFromResponse).toHaveProperty('endpointId', sushiTest?.endpointId);
            expect(sushiFromResponse).toHaveProperty('customerId', sushiTest?.customerId);
            expect(sushiFromResponse).toHaveProperty('requestorId', sushiTest?.requestorId);
            expect(sushiFromResponse).toHaveProperty('apiKey', sushiTest?.apiKey);
            expect(sushiFromResponse).toHaveProperty('comment', sushiTest?.comment);
            expect(sushiFromResponse).toHaveProperty('tags', sushiTest?.tags);
            expect(sushiFromResponse).toHaveProperty('params', sushiTest?.params);
            expect(sushiFromResponse?.endpoint).not.toBeNull();
          });
        });

        afterAll(async () => {
          await membershipsService.deleteAll();
        });
      });

      describe('User with memberships []', () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = emptyPermission;
          await membershipsService.create({ data: membershipUserTest });
        });

        describe('GET /sushi/<id> - Get sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#06 Should not get sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'GET',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);
          });
        });

        afterAll(async () => {
          await membershipsService.deleteAll();
        });
      });

      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });

    describe('Institution created by another user', () => {
      let anotherUserTestInstitutionId;
      let userTestInstitutionId;

      beforeAll(async () => {
        await createUserAsAdmin(
          anotherUserTest.username,
          anotherUserTest.email,
          anotherUserTest.fullName,
          anotherUserTest.isAdmin,
        );
        await activateUser(
          anotherUserTest.username,
          anotherUserTest.password,
        );
        anotherUserTestInstitutionId = await createInstitution(institutionTest, anotherUserTest);
        userTestInstitutionId = await createInstitution(institutionTest, userTest);
      });

      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = readPermission;
          // FIXME membership create by function createInstitution
          // await membershipsService.create({ data: membershipUserTest });
        });
        describe('GET /sushi/<id> - Get sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#07 Should not get sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'GET',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },

            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);
          });
        });
        afterAll(async () => {
          await membershipsService.deleteAll();
        });
      });

      describe(`User with memberships [${readPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = readPermission;
          await membershipsService.create({ data: membershipUserTest });
        });
        describe('GET /sushi/<id> - Get sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#08 Should not get sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'GET',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },

            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);
          });
        });

        afterAll(async () => {
          await membershipsService.deleteAll();
        });
      });

      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });

    afterAll(async () => {
      await usersService.deleteAll();
    });
  });
  describe('With random token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('GET /sushi/<id> - Get sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#09 Should not get sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: 'Bearer: random',
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 401);
        });
      });
      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });
  });
  describe('Without token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('GET /sushi/<id> - Get sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#10 Should not get sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/sushi/${sushiId}`,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 401);
        });
      });
      afterAll(async () => {
        await institutionsService.deleteAll();
      });
    });
  });
  afterAll(async () => {
    await sushiEndpointsService.deleteAll();
  });
});
