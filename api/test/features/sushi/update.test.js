const ezmesure = require('../../setup/ezmesure');

const institutionsService = require('../../../lib/entities/institutions.service');
const usersService = require('../../../lib/entities/users.service');
const sushiEndpointsService = require('../../../lib/entities/sushi-endpoint.service');
const sushiCredentialsService = require('../../../lib/entities/sushi-credentials.service');
const membershipsService = require('../../../lib/entities/memberships.service');

const {
  createInstitution,
  addMembershipsToUserAsAdmin,
  validateInstitutionAsAdmin,
} = require('../../setup/institutions');
const {
  createDefaultActivatedUserAsAdmin,
  createUserAsAdmin,
  activateUser,
} = require('../../setup/users');

const { getToken, getAdminToken } = require('../../setup/login');

describe('[sushi]: Test update sushi features', () => {
  const allPermission = ['sushi:write', 'sushi:read'];
  const readPermission = ['sushi:read'];
  const emptyPermission = [];

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
    apiKey: 'apikey test',
    comment: 'comment test',
    tags: [],
    params: [],
  };

  const sushiUpdatedTest = {
    endpointId: '',
    institutionId: '',
    customerId: 'customerId test updated',
    requestorId: 'requestorId test updated',
    apiKey: 'apikey test updated',
    comment: 'comment test updated',
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

      describe('PATCH /sushi/<id> - Update sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          sushiUpdatedTest.endpointId = sushiEndpointId;
          sushiUpdatedTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#01 Should update sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'PATCH',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: sushiUpdatedTest,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          const sushiFromResponse = httpAppResponse?.data;

          expect(sushiFromResponse).toHaveProperty('id', sushiId);
          expect(sushiFromResponse?.createdAt).not.toBeNull();
          expect(sushiFromResponse?.updatedAt).not.toBeNull();
          expect(sushiFromResponse).toHaveProperty('institutionId', sushiUpdatedTest?.institutionId);
          expect(sushiFromResponse).toHaveProperty('endpointId', sushiUpdatedTest?.endpointId);
          expect(sushiFromResponse).toHaveProperty('customerId', sushiUpdatedTest?.customerId);
          expect(sushiFromResponse).toHaveProperty('requestorId', sushiUpdatedTest?.requestorId);
          expect(sushiFromResponse).toHaveProperty('apiKey', sushiUpdatedTest?.apiKey);
          expect(sushiFromResponse).toHaveProperty('comment', sushiUpdatedTest?.comment);
          expect(sushiFromResponse).toHaveProperty('tags', sushiUpdatedTest?.tags);
          expect(sushiFromResponse).toHaveProperty('params', sushiUpdatedTest?.params);

          // Test service
          const sushiFromService = await sushiCredentialsService.findByID(sushiId);

          expect(sushiFromService).toHaveProperty('id', sushiId);
          expect(sushiFromService?.createdAt).not.toBeNull();
          expect(sushiFromService?.updatedAt).not.toBeNull();
          expect(sushiFromService).toHaveProperty('institutionId', sushiUpdatedTest?.institutionId);
          expect(sushiFromService).toHaveProperty('endpointId', sushiUpdatedTest?.endpointId);
          expect(sushiFromService).toHaveProperty('customerId', sushiUpdatedTest?.customerId);
          expect(sushiFromService).toHaveProperty('requestorId', sushiUpdatedTest?.requestorId);
          expect(sushiFromService).toHaveProperty('apiKey', sushiUpdatedTest?.apiKey);
          expect(sushiFromService).toHaveProperty('comment', sushiUpdatedTest?.comment);
          expect(sushiFromService).toHaveProperty('tags', sushiUpdatedTest?.tags);
          expect(sushiFromService).toHaveProperty('params', sushiUpdatedTest?.params);
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

      describe('PATCH /sushi/<id> - Update sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          sushiUpdatedTest.endpointId = sushiEndpointId;
          sushiUpdatedTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#02 Should update sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'PATCH',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            data: sushiUpdatedTest,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 200);

          const sushiFromResponse = httpAppResponse?.data;

          expect(sushiFromResponse).toHaveProperty('id', sushiId);
          expect(sushiFromResponse?.createdAt).not.toBeNull();
          expect(sushiFromResponse?.updatedAt).not.toBeNull();
          expect(sushiFromResponse).toHaveProperty('institutionId', sushiUpdatedTest?.institutionId);
          expect(sushiFromResponse).toHaveProperty('endpointId', sushiUpdatedTest?.endpointId);
          expect(sushiFromResponse).toHaveProperty('customerId', sushiUpdatedTest?.customerId);
          expect(sushiFromResponse).toHaveProperty('requestorId', sushiUpdatedTest?.requestorId);
          expect(sushiFromResponse).toHaveProperty('apiKey', sushiUpdatedTest?.apiKey);
          expect(sushiFromResponse).toHaveProperty('comment', sushiUpdatedTest?.comment);
          expect(sushiFromResponse).toHaveProperty('tags', sushiUpdatedTest?.tags);
          expect(sushiFromResponse).toHaveProperty('params', sushiUpdatedTest?.params);

          // Test service
          const sushiFromService = await sushiCredentialsService.findByID(sushiId);

          expect(sushiFromService).toHaveProperty('id', sushiId);
          expect(sushiFromService?.createdAt).not.toBeNull();
          expect(sushiFromService?.updatedAt).not.toBeNull();
          expect(sushiFromService).toHaveProperty('institutionId', sushiUpdatedTest?.institutionId);
          expect(sushiFromService).toHaveProperty('endpointId', sushiUpdatedTest?.endpointId);
          expect(sushiFromService).toHaveProperty('customerId', sushiUpdatedTest?.customerId);
          expect(sushiFromService).toHaveProperty('requestorId', sushiUpdatedTest?.requestorId);
          expect(sushiFromService).toHaveProperty('apiKey', sushiUpdatedTest?.apiKey);
          expect(sushiFromService).toHaveProperty('comment', sushiUpdatedTest?.comment);
          expect(sushiFromService).toHaveProperty('tags', sushiUpdatedTest?.tags);
          expect(sushiFromService).toHaveProperty('params', sushiUpdatedTest?.params);
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
      describe('PATCH /sushi/<id> - Update sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          sushiUpdatedTest.endpointId = sushiEndpointId;
          sushiUpdatedTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#03 Should not update sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'PATCH',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: sushiUpdatedTest,
          });
          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);
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
        await validateInstitutionAsAdmin(institutionId);
      });

      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = allPermission;
          // FIXME membership create by function createInstitution
          // await membershipsService.create({ data: membershipUserTest });
        });
        describe('PATCH /sushi/<id> - Update sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            sushiUpdatedTest.endpointId = sushiEndpointId;
            sushiUpdatedTest.institutionId = institutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#04 Should update sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'PATCH',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiUpdatedTest,
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 200);

            const sushiFromResponse = httpAppResponse?.data;

            expect(sushiFromResponse).toHaveProperty('id', sushiId);
            expect(sushiFromResponse?.createdAt).not.toBeNull();
            expect(sushiFromResponse?.updatedAt).not.toBeNull();
            expect(sushiFromResponse).toHaveProperty('institutionId', sushiUpdatedTest?.institutionId);
            expect(sushiFromResponse).toHaveProperty('endpointId', sushiUpdatedTest?.endpointId);
            expect(sushiFromResponse).toHaveProperty('customerId', sushiUpdatedTest?.customerId);
            expect(sushiFromResponse).toHaveProperty('requestorId', sushiUpdatedTest?.requestorId);
            expect(sushiFromResponse).toHaveProperty('apiKey', sushiUpdatedTest?.apiKey);
            expect(sushiFromResponse).toHaveProperty('comment', sushiUpdatedTest?.comment);
            expect(sushiFromResponse).toHaveProperty('tags', sushiUpdatedTest?.tags);
            expect(sushiFromResponse).toHaveProperty('params', sushiUpdatedTest?.params);

            // Test service
            const sushiFromService = await sushiCredentialsService.findByID(sushiId);

            expect(sushiFromService).toHaveProperty('id', sushiId);
            expect(sushiFromService?.createdAt).not.toBeNull();
            expect(sushiFromService?.updatedAt).not.toBeNull();
            expect(sushiFromService).toHaveProperty('institutionId', sushiUpdatedTest?.institutionId);
            expect(sushiFromService).toHaveProperty('endpointId', sushiUpdatedTest?.endpointId);
            expect(sushiFromService).toHaveProperty('customerId', sushiUpdatedTest?.customerId);
            expect(sushiFromService).toHaveProperty('requestorId', sushiUpdatedTest?.requestorId);
            expect(sushiFromService).toHaveProperty('apiKey', sushiUpdatedTest?.apiKey);
            expect(sushiFromService).toHaveProperty('comment', sushiUpdatedTest?.comment);
            expect(sushiFromService).toHaveProperty('tags', sushiUpdatedTest?.tags);
            expect(sushiFromService).toHaveProperty('params', sushiUpdatedTest?.params);
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
        describe('PATCH /sushi/<id> - Update sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            sushiUpdatedTest.endpointId = sushiEndpointId;
            sushiUpdatedTest.institutionId = institutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#05 Should not update sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'PATCH',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiUpdatedTest,
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
        await validateInstitutionAsAdmin(anotherUserTestInstitutionId);
        userTestInstitutionId = await createInstitution(institutionTest, userTest);
        await validateInstitutionAsAdmin(userTestInstitutionId);
      });

      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = allPermission;
          // FIXME membership create by function createInstitution
          // await membershipsService.create({ data: membershipUserTest });
        });
        describe('PATCH /sushi/<id> - Update sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            sushiUpdatedTest.endpointId = sushiEndpointId;
            sushiUpdatedTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#06 Should not update sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'PATCH',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiUpdatedTest,
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
        describe('PATCH /sushi/<id> - Update sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            sushiUpdatedTest.endpointId = sushiEndpointId;
            sushiUpdatedTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#07 Should not update sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'PATCH',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiUpdatedTest,
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
      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = allPermission;
          await membershipsService.create({ data: membershipUserTest });
        });
        describe('PATCH /sushi/<id> - Update sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            sushiUpdatedTest.endpointId = sushiEndpointId;
            sushiUpdatedTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#08 Should not update sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'PATCH',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiUpdatedTest,
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
          await addMembershipsToUserAsAdmin(userTestInstitutionId, userTest.username, ['sushi:read']);
        });
        describe('PATCH /sushi/<id> - Update sushi', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            sushiUpdatedTest.endpointId = sushiEndpointId;
            sushiUpdatedTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsService.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#09 Should not update sushi', async () => {
            const httpAppResponse = await ezmesure({
              method: 'PATCH',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: sushiUpdatedTest,
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);
          });
        });

        afterAll(async () => {
          await membershipsService.deleteAll();
        });
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

      describe('PATCH /sushi/<id> - Update sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          sushiUpdatedTest.endpointId = sushiEndpointId;
          sushiUpdatedTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#10 Should not update sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'PATCH',
            url: `/sushi/${sushiId}`,
            data: sushiUpdatedTest,
            headers: {
              Authorization: 'Bearer: random',
            },
          });
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

      describe('PATCH /sushi/<id> - Update sushi', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          sushiUpdatedTest.endpointId = sushiEndpointId;
          sushiUpdatedTest.institutionId = institutionId;
          const sushi = await sushiCredentialsService.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#11 Should not update sushi', async () => {
          const httpAppResponse = await ezmesure({
            method: 'PATCH',
            url: `/sushi/${sushiId}`,
            data: sushiUpdatedTest,
          });
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
