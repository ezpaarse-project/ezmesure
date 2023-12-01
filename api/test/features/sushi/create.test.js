const ezmesure = require('../../setup/ezmesure');

const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');
const sushiEndpointsService = require('../../../lib/entities/sushi-endpoints.service');
const sushiCredentialsService = require('../../../lib/entities/sushi-credentials.service');
const membershipsService = require('../../../lib/entities/memberships.service');

const { createInstitution } = require('../../setup/institutions');
const { createDefaultActivatedUserAsAdmin, createUserAsAdmin } = require('../../setup/users');
const { getToken, getAdminToken } = require('../../setup/login');

describe('[sushi]: Test create sushi credential features', () => {
  const allPermission = ['sushi:write', 'sushi:read'];
  const readPermission = ['sushi:read'];
  // TODO test with emptyPermission
  // const emptyPermission = [];

  const institutionTest = {
    name: 'Test',
    namespace: 'test',
    validated: true,
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
    apiKey: 'apiKey test',
    comment: 'comment test',
    tags: [],
    params: [],
  };

  let adminToken;
  let sushiEndpointId;

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

      describe('Create sushi', () => {
        let sushiId;
        beforeAll(() => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
        });

        it('#01 Should create sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/sushi',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: sushiTest,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 201);

          const sushiFromResponse = httpAppResponse?.data;
          sushiId = sushiFromResponse.id;

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

          // Test service
          const sushiFromService = await sushiCredentialsService.findByID(sushiId);

          expect(sushiFromService).toHaveProperty('id', sushiId);
          expect(sushiFromService?.createdAt).not.toBeNull();
          expect(sushiFromService?.updatedAt).not.toBeNull();
          expect(sushiFromService).toHaveProperty('institutionId', sushiTest?.institutionId);
          expect(sushiFromService).toHaveProperty('endpointId', sushiTest?.endpointId);
          expect(sushiFromService).toHaveProperty('customerId', sushiTest?.customerId);
          expect(sushiFromService).toHaveProperty('requestorId', sushiTest?.requestorId);
          expect(sushiFromService).toHaveProperty('apiKey', sushiTest?.apiKey);
          expect(sushiFromService).toHaveProperty('comment', sushiTest?.comment);
          expect(sushiFromService).toHaveProperty('tags', sushiTest?.tags);
          expect(sushiFromService).toHaveProperty('params', sushiTest?.params);
        });

        afterAll(async () => {
          await sushiCredentialsService.removeAll();
        });
      });

      afterAll(async () => {
        await institutionsService.removeAll();
      });
    });
    describe('Institution created by user', () => {
      let institutionId;
      beforeAll(async () => {
        await createDefaultActivatedUserAsAdmin();
        institutionId = await createInstitution(institutionTest, userTest);
      });

      describe('Create sushi', () => {
        let sushiId;
        beforeAll(() => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
        });

        it('#02 Should create sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/sushi',
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: sushiTest,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 201);

          const sushiFromResponse = httpAppResponse?.data;
          sushiId = sushiFromResponse.id;

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

          // Test service
          const sushiFromService = await sushiCredentialsService.findByID(sushiId);

          expect(sushiFromService).toHaveProperty('id', sushiId);
          expect(sushiFromService?.createdAt).not.toBeNull();
          expect(sushiFromService?.updatedAt).not.toBeNull();
          expect(sushiFromService).toHaveProperty('institutionId', sushiTest?.institutionId);
          expect(sushiFromService).toHaveProperty('endpointId', sushiTest?.endpointId);
          expect(sushiFromService).toHaveProperty('customerId', sushiTest?.customerId);
          expect(sushiFromService).toHaveProperty('requestorId', sushiTest?.requestorId);
          expect(sushiFromService).toHaveProperty('apiKey', sushiTest?.apiKey);
          expect(sushiFromService).toHaveProperty('comment', sushiTest?.comment);
          expect(sushiFromService).toHaveProperty('tags', sushiTest?.tags);
          expect(sushiFromService).toHaveProperty('params', sushiTest?.params);
        });

        afterAll(async () => {
          await sushiCredentialsService.removeAll();
        });
      });

      afterAll(async () => {
        await institutionsService.removeAll();
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

      describe('Create sushi', () => {
        beforeAll(() => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
        });

        it('#03 Should not create sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/sushi',
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: sushiTest,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);

          // Test service
          const sushiFromService = await sushiCredentialsService.findMany();
          expect(sushiFromService).toEqual([]);
        });
      });

      afterAll(async () => {
        await institutionsService.removeAll();
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
        });
        describe('Create new sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
          });

          it('#04 Should create sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'POST',
              url: '/sushi',
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiTest,
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 201);

            const sushiFromResponse = httpAppResponse?.data;
            sushiId = sushiFromResponse.id;

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

            // Test service
            const sushiFromService = await sushiCredentialsService.findByID(sushiId);

            expect(sushiFromService).toHaveProperty('id', sushiId);
            expect(sushiFromService?.createdAt).not.toBeNull();
            expect(sushiFromService?.updatedAt).not.toBeNull();
            expect(sushiFromService).toHaveProperty('institutionId', sushiTest?.institutionId);
            expect(sushiFromService).toHaveProperty('endpointId', sushiTest?.endpointId);
            expect(sushiFromService).toHaveProperty('customerId', sushiTest?.customerId);
            expect(sushiFromService).toHaveProperty('requestorId', sushiTest?.requestorId);
            expect(sushiFromService).toHaveProperty('apiKey', sushiTest?.apiKey);
            expect(sushiFromService).toHaveProperty('comment', sushiTest?.comment);
            expect(sushiFromService).toHaveProperty('tags', sushiTest?.tags);
            expect(sushiFromService).toHaveProperty('params', sushiTest?.params);
          });

          afterAll(async () => {
            await sushiCredentialsService.removeAll();
          });
        });
        afterAll(async () => {
          await membershipsService.removeAll();
        });
      });

      describe(`User with memberships [${readPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = readPermission;
          await membershipsService.create({ data: membershipUserTest });
        });
        describe('Create new sushi credential', () => {
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
          });

          it('#05 Should not create sushi credential', async () => {
            const httpAppResponse = await ezmesure({
              method: 'POST',
              url: '/sushi',
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiTest,
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);

            // Test service
            const sushiFromService = await sushiCredentialsService.findMany();
            expect(sushiFromService).toEqual([]);
          });
          afterAll(async () => {
            await membershipsService.removeAll();
          });
        });
      });

      afterAll(async () => {
        await institutionsService.removeAll();
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
        anotherUserTestInstitutionId = await createInstitution(institutionTest, anotherUserTest);
        userTestInstitutionId = await createInstitution(institutionTest, userTest);
      });

      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = allPermission;
          // FIXME membership create by function createInstitution
          // await membershipsService.create({ data: membershipUserTest });
        });
        describe('Create new sushi credential', () => {
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
          });

          it('#06 Should not create sushi credential', async () => {
            const httpAppResponse = await ezmesure({
              method: 'POST',
              url: '/sushi',
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiTest,
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);

            // Test service
            const sushiFromService = await sushiCredentialsService.findMany();
            expect(sushiFromService).toEqual([]);
          });
        });
        afterAll(async () => {
          await membershipsService.removeAll();
        });
      });

      describe(`User with memberships [${readPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = readPermission;
          await membershipsService.create({ data: membershipUserTest });
        });
        describe('Create new sushi credential', () => {
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
          });

          it('#07 Should not create sushi credential', async () => {
            const httpAppResponse = await ezmesure({
              method: 'POST',
              url: '/sushi',
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiTest,
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);

            // Test service
            const sushiFromService = await sushiCredentialsService.findMany();
            expect(sushiFromService).toEqual([]);
          });
        });

        afterAll(async () => {
          await membershipsService.removeAll();
        });
      });

      afterAll(async () => {
        await institutionsService.removeAll();
      });
    });

    afterAll(async () => {
      await usersService.removeAll();
    });
  });
  describe('Without token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsService.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('Create sushi', () => {
        beforeAll(() => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
        });

        it('#08 Should not create sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'POST',
            url: '/sushi',
            data: sushiTest,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 401);

          // Test service
          const sushiFromService = await sushiCredentialsService.findMany();
          expect(sushiFromService).toEqual([]);
        });
      });
      afterAll(async () => {
        await institutionsService.removeAll();
      });
    });
  });
  afterAll(async () => {
    await sushiEndpointsService.removeAll();
  });
});
