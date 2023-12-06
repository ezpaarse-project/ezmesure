const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');

const institutionsPrisma = require('../../../lib/services/prisma/institutions');
const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const usersService = require('../../../lib/entities/users.service');
const sushiEndpointsPrisma = require('../../../lib/services/prisma/sushi-endpoints');
const sushiCredentialsPrisma = require('../../../lib/services/prisma/sushi-credentials');
const membershipsPrisma = require('../../../lib/services/prisma/memberships');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

describe('[sushi]: Test delete sushi credential features', () => {
  const allPermission = ['sushi:write', 'sushi:read'];
  const readPermission = ['sushi:read'];
  // TODO test with emptyPermission
  // const emptyPermission = [];

  const institutionTest = {
    name: 'Test',
  };

  const institutionTest2 = {
    name: 'Test2',
  };

  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const userPassword = 'changeme';

  const membershipUserTest = {
    username: userTest.username,
  };

  const anotherUserTest = {
    username: 'another.user',
    email: 'another.user@test.fr',
    fullName: 'Another user',
    isAdmin: false,
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

  let adminToken;
  let sushiEndpointId;

  beforeAll(async () => {
    await resetDatabase();
    adminToken = await usersService.generateToken(adminUsername, adminPassword);
    const sushiEndpoint = await sushiEndpointsPrisma.create({ data: sushiEndpointTest });
    sushiEndpointId = sushiEndpoint.id;
  });
  describe('As admin', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsPrisma.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('Delete sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#01 Should delete sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'DELETE',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          // Test API
          expect(httpAppResponse).toHaveProperty('status', 204);

          // Test service
          const sushiFromService = await sushiCredentialsPrisma.findMany();
          expect(sushiFromService).toEqual([]);
        });

        afterAll(async () => {
          await sushiCredentialsPrisma.removeAll();
        });
      });

      afterAll(async () => {
        await institutionsPrisma.removeAll();
      });
    });
    describe('Institution created by user', () => {
      let institutionId;
      beforeAll(async () => {
        await usersPrisma.create({ data: userTest });
        await usersElastic.createUser(userTest);
        const institution = await institutionsPrisma
          .createAsUser(institutionTest, userTest.username);
        institutionId = institution.id;
      });

      describe('Delete sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#02 Should delete sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'DELETE',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 204);

          // Test service
          const sushiFromService = await sushiCredentialsPrisma.findMany();
          expect(sushiFromService).toEqual([]);
        });

        afterAll(async () => {
          await sushiCredentialsPrisma.removeAll();
        });
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
        await usersPrisma.removeAll();
        await institutionsPrisma.removeAll();
      });
    });
  });
  describe('As user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      await usersPrisma.acceptTerms(userTest.username);
      userToken = await usersService.generateToken(userTest.username, userPassword);
    });

    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsPrisma.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('Delete sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#03 Should not delete sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'DELETE',
            url: `/sushi/${sushiId}`,
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });
          // Test API
          expect(httpAppResponse).toHaveProperty('status', 403);

          // Test service
          const sushiFromService = await sushiCredentialsPrisma.findByID(sushiId);

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
          await sushiCredentialsPrisma.removeAll();
        });
      });

      afterAll(async () => {
        await membershipsPrisma.removeAll();
        await institutionsPrisma.removeAll();
      });
    });
    describe('Institution created by user', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsPrisma
          .createAsUser(institutionTest, userTest.username);
        institutionId = institution.id;
        await institutionsPrisma.validate(institutionId);
      });

      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = allPermission;
        });
        describe('Delete sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#04 Should delete sushi credential', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });
            // Test API
            expect(httpAppResponse).toHaveProperty('status', 204);

            // Test service
            const sushiFromService = await sushiCredentialsPrisma.findMany();
            expect(sushiFromService).toEqual([]);
          });

          afterAll(async () => {
            await sushiCredentialsPrisma.removeAll();
          });
        });
        afterAll(async () => {
          await membershipsPrisma.removeAll();
        });
      });

      describe(`User with memberships [${readPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = readPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });
        describe('Delete sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#05 Should not delete sushi credential', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);

            // Test service
            const sushiFromService = await sushiCredentialsPrisma.findByID(sushiId);

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
            await sushiCredentialsPrisma.removeAll();
          });
        });

        afterAll(async () => {
          await membershipsPrisma.removeAll();
        });
      });

      afterAll(async () => {
        await institutionsPrisma.removeAll();
      });
    });

    describe('Institution created by another user', () => {
      let anotherUserTestInstitutionId;
      let userTestInstitutionId;

      beforeAll(async () => {
        await usersPrisma.create({ data: anotherUserTest });
        await usersElastic.createUser(anotherUserTest);

        const institution2 = await institutionsPrisma
          .createAsUser(institutionTest2, anotherUserTest.username);
        anotherUserTestInstitutionId = institution2.id;

        const institution = await institutionsPrisma
          .createAsUser(institutionTest, userTest.username);
        userTestInstitutionId = institution.id;
      });

      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = allPermission;
          // FIXME membership already created
          // await membershipsPrisma.create({ data: membershipUserTest });
        });
        describe('Delete sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#06 Should not delete sushi credential', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);

            // Test service
            const sushiFromService = await sushiCredentialsPrisma.findByID(sushiId);

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
            await sushiCredentialsPrisma.removeAll();
          });
        });
        afterAll(async () => {
          await membershipsPrisma.removeAll();
        });
      });

      describe(`User with memberships [${readPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = readPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });
        describe('Delete sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#07 Should not delete sushi credential', async () => {
            const httpAppResponse = await ezmesure({
              method: 'DELETE',
              url: `/sushi/${sushiId}`,
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });

            // Test API
            expect(httpAppResponse).toHaveProperty('status', 403);

            // Test service
            const sushiFromService = await sushiCredentialsPrisma.findByID(sushiId);

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
            await sushiCredentialsPrisma.removeAll();
          });
        });

        afterAll(async () => {
          await membershipsPrisma.removeAll();
        });
      });

      afterAll(async () => {
        await institutionsPrisma.removeAll();
      });
    });

    afterAll(async () => {
      await usersPrisma.removeAll();
    });
  });
  describe('Without token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsPrisma.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('Delete sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#08 Should not delete sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'DELETE',
            url: `/sushi/${sushiId}`,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 401);

          // Test service
          const sushiFromService = await sushiCredentialsPrisma.findByID(sushiId);

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
          await sushiCredentialsPrisma.removeAll();
        });
      });

      afterAll(async () => {
        await institutionsPrisma.removeAll();
      });
    });
  });
  afterAll(async () => {
    await resetDatabase();
  });
});
