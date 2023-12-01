/* eslint-disable max-len */
const ezmesure = require('../../../setup/ezmesure');

const institutionsService = require('../../../../lib/entities/institutions.service');
const usersService = require('../../../../lib/entities/users.service');

const { createUserAsAdmin, activateUser } = require('../../../setup/users');
const { getToken, getAdminToken } = require('../../../setup/login');
const { resetDatabase } = require('../../../../lib/services/prisma/utils');

describe('[institutions - subinstitution]: Test delete features', () => {
  const masterInstitutionTest = {
    name: 'Master Test',
    namespace: 'master-test',
  };
  const subInstitutionTest = {
    name: 'Sub Test',
    namespace: 'sub-test',
  };

  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
    password: 'changeme',
  };

  const anotherUserTest = {
    username: 'another.user',
    email: 'another.user@test.fr',
    fullName: 'Another user',
    isAdmin: false,
    password: 'changeme',
  };

  let adminToken;
  let userToken;
  let masterInstitutionId;
  let subInstitutionId;

  beforeAll(async () => {
    await resetDatabase();
    adminToken = await getAdminToken();

    await createUserAsAdmin(
      userTest.username,
      userTest.email,
      userTest.fullName,
      userTest.isAdmin,
    );
    await activateUser(userTest.username, userTest.password);
    userToken = await getToken(userTest.username, userTest.password);

    await createUserAsAdmin(
      anotherUserTest.username,
      anotherUserTest.email,
      anotherUserTest.fullName,
      anotherUserTest.isAdmin,
    );
    await activateUser(anotherUserTest.username, anotherUserTest.password);
  });

  describe('As admin', () => {
    beforeAll(async () => {
      const masterInstitution = await institutionsService.create({ data: masterInstitutionTest });
      masterInstitutionId = masterInstitution.id;
      const subInstitution = await institutionsService.create({ data: subInstitutionTest });
      subInstitutionId = subInstitution.id;
      await institutionsService.addSubInstitution(masterInstitutionId, subInstitutionId);
    });

    describe('Delete subinstitution [Sub Test] for [Master Test] institution', () => {
      it('#01 Should create subinstitution', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${masterInstitutionId}/subinstitutions/${subInstitutionId}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const masterInstitutionFromResponse = httpAppResponse?.data;

        expect(masterInstitutionFromResponse).toHaveProperty('id', masterInstitutionId);
        expect(masterInstitutionFromResponse).toHaveProperty('parentInstitutionId', null);
        expect(masterInstitutionFromResponse).toHaveProperty('childInstitutions', []);
      });
    });
    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });
  describe('As User', () => {
    beforeAll(async () => {
      const masterInstitution = await institutionsService.create({ data: masterInstitutionTest });
      masterInstitutionId = masterInstitution.id;
      const subInstitution = await institutionsService.create({ data: subInstitutionTest });
      subInstitutionId = subInstitution.id;
      await institutionsService.addSubInstitution(masterInstitutionId, subInstitutionId);
    });
    describe('Delete subinstitution [Sub Test] for [Master Test] institution', () => {
      it('#02 Should not delete subinstitution', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${masterInstitutionId}/subinstitutions/${subInstitutionId}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 403);
      });
    });
    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });
  describe('Without token', () => {
    beforeAll(async () => {
      const masterInstitution = await institutionsService.create({ data: masterInstitutionTest });
      masterInstitutionId = masterInstitution.id;
      const subInstitution = await institutionsService.create({ data: subInstitutionTest });
      subInstitutionId = subInstitution.id;
      await institutionsService.addSubInstitution(masterInstitutionId, subInstitutionId);
    });
    describe('Delete subinstitution [Sub Test] for [Master Test] institution', () => {
      it('#03 Should not delete subinstitution', async () => {
        const httpAppResponse = await ezmesure({
          method: 'DELETE',
          url: `/institutions/${masterInstitutionId}/subinstitutions/${subInstitutionId}`,
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 401);
      });
    });

    afterAll(async () => {
      await institutionsService.removeAll();
    });
  });

  afterAll(async () => {
    await resetDatabase();
  });
});
