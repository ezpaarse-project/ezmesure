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

describe('[institutions - subinstitution]: Test read features', () => {
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

  const userPassword = 'changeme';

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
    adminToken = await UsersService.generateToken(adminUsername, adminPassword);

    await usersPrisma.create({ data: userTest });
    await usersElastic.createUser(userTest);
    userToken = await UsersService.generateToken(userTest.username, userPassword);

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

    describe('Read subinstitution [Sub Test] for [Master Test] institution', () => {
      it('#01 Should get subinstitution', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/institutions/${masterInstitutionId}/subinstitutions`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Test API
        expect(httpAppResponse).toHaveProperty('status', 200);

        const subInstitutionsFromResponse = httpAppResponse?.data;

        const [subInstitutionFromResponse] = subInstitutionsFromResponse;

        expect(subInstitutionFromResponse).toHaveProperty('id', subInstitutionId);
        expect(subInstitutionFromResponse).toHaveProperty('parentInstitutionId', masterInstitutionId);
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
    describe('Read subinstitution [Sub Test] for [Master Test] institution', () => {
      it('#02 Should not get subinstitution', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/institutions/${masterInstitutionId}/subinstitutions`,
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
    describe('Read subinstitution [Sub Test] for [Master Test] institution', () => {
      it('#03 Should not get subinstitution', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/institutions/${masterInstitutionId}/subinstitutions`,
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
