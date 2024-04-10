const config = require('config');

const ezmesure = require('../../../setup/ezmesure');

const { resetDatabase } = require('../../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../../lib/services/elastic/utils');

const institutionsPrisma = require('../../../../lib/services/prisma/institutions');
const usersPrisma = require('../../../../lib/services/prisma/users');
const usersElastic = require('../../../../lib/services/elastic/users');
const UsersService = require('../../../../lib/entities/users.service');

const adminUsername = config.get('admin.username');
const adminPassword = config.get('admin.password');

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
  };

  const anotherUserTest = {
    username: 'another.user',
    email: 'another.user@test.fr',
    fullName: 'Another user',
    isAdmin: false,
  };

  let adminToken;
  let userToken;
  let masterInstitutionId;
  let subInstitutionId;

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    adminToken = await (new UsersService()).generateToken(adminUsername, adminPassword);

    await usersPrisma.create({ data: userTest });
    await usersElastic.createUser(userTest);
    userToken = await (new UsersService()).generateToken(userTest.username, userTest.password);

    await usersPrisma.create({ data: anotherUserTest });
    await usersElastic.createUser(anotherUserTest);
  });

  describe('As admin', () => {
    beforeAll(async () => {
      const masterInstitution = await institutionsPrisma.create({ data: masterInstitutionTest });
      masterInstitutionId = masterInstitution.id;
      const subInstitution = await institutionsPrisma.create({ data: subInstitutionTest });
      subInstitutionId = subInstitution.id;
      await institutionsPrisma.addSubInstitution(masterInstitutionId, subInstitutionId);
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
      await institutionsPrisma.removeAll();
    });
  });
  describe('As User', () => {
    beforeAll(async () => {
      const masterInstitution = await institutionsPrisma.create({ data: masterInstitutionTest });
      masterInstitutionId = masterInstitution.id;
      const subInstitution = await institutionsPrisma.create({ data: subInstitutionTest });
      subInstitutionId = subInstitution.id;
      await institutionsPrisma.addSubInstitution(masterInstitutionId, subInstitutionId);
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
      await institutionsPrisma.removeAll();
    });
  });
  describe('Without token', () => {
    beforeAll(async () => {
      const masterInstitution = await institutionsPrisma.create({ data: masterInstitutionTest });
      masterInstitutionId = masterInstitution.id;
      const subInstitution = await institutionsPrisma.create({ data: subInstitutionTest });
      subInstitutionId = subInstitution.id;
      await institutionsPrisma.addSubInstitution(masterInstitutionId, subInstitutionId);
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
      await institutionsPrisma.removeAll();
    });
  });

  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
