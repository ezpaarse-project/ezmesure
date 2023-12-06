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

describe('[sushi]: Test read sushi credential features', () => {
  const allPermission = ['sushi:write', 'sushi:read'];
  const readPermission = ['sushi:read'];
  const emptyPermission = [];

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

  const anotherUserTestPermissions = allPermission;

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

      describe('Get sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#01 Should get sushi credential', async () => {
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

      describe('Get sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#02 Should get sushi credential', async () => {
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
      describe('Get sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#03 Should not get sushi credential', async () => {
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
        const institution = await institutionsPrisma
          .createAsUser(institutionTest, userTest.username);
        institutionId = institution.id;
        await institutionsPrisma.validate(institutionId);
      });

      describe(`User with memberships [${allPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = allPermission;
          // FIXME membership already created
          // await membershipsPrisma.create({ data: membershipUserTest });
        });
        describe('Get sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#04 Should get sushi credential', async () => {
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
        describe('Get sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#05 Should get sushi credential', async () => {
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
          await membershipsPrisma.removeAll();
        });
      });

      describe('User with memberships []', () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = institutionId;
          membershipUserTest.permissions = emptyPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });

        describe('Get sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = institutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#06 Should not get sushi credential', async () => {
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
          membershipUserTest.permissions = readPermission;
          // FIXME membership already created
          // await membershipsPrisma.create({ data: membershipUserTest });
        });
        describe('Get sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#07 Should not get sushi credential', async () => {
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
          await membershipsPrisma.removeAll();
        });
      });

      describe(`User with memberships [${readPermission}]`, () => {
        beforeAll(async () => {
          membershipUserTest.institutionId = userTestInstitutionId;
          membershipUserTest.permissions = readPermission;
          await membershipsPrisma.create({ data: membershipUserTest });
        });
        describe('Get sushi credential', () => {
          let sushiId;
          beforeAll(async () => {
            sushiTest.endpointId = sushiEndpointId;
            sushiTest.institutionId = anotherUserTestInstitutionId;
            const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
            sushiId = sushi.id;
          });

          it('#08 Should not get sushi credential', async () => {
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
          await membershipsPrisma.removeAll();
        });
      });

      afterAll(async () => {
        await institutionsPrisma.removeAll();
      });
    });

    afterAll(async () => {
      await membershipsPrisma.removeAll();
      await usersPrisma.removeAll();
    });
  });
  describe('With random token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsPrisma.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('Get sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#09 Should not get sushi credential', async () => {
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
        await institutionsPrisma.removeAll();
      });
    });
  });
  describe('Without token', () => {
    describe('Institution created by admin', () => {
      let institutionId;
      beforeAll(async () => {
        const institution = await institutionsPrisma.create({ data: institutionTest });
        institutionId = institution.id;
      });

      describe('Get sushi credential', () => {
        let sushiId;
        beforeAll(async () => {
          sushiTest.endpointId = sushiEndpointId;
          sushiTest.institutionId = institutionId;
          const sushi = await sushiCredentialsPrisma.create({ data: sushiTest });
          sushiId = sushi.id;
        });

        it('#10 Should not get sushi credential', async () => {
          const httpAppResponse = await ezmesure({
            method: 'GET',
            url: `/sushi/${sushiId}`,
          });

          // Test API
          expect(httpAppResponse).toHaveProperty('status', 401);
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
