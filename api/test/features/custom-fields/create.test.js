const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const UsersService = require('../../../lib/entities/users.service');
const customFieldsPrisma = require('../../../lib/services/prisma/custom-fields');

const adminUsername = config.get('admin.username');

const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;

describe('[custom-fields]: Test create features', () => {
  const baseFieldData = {
    id: 'some-id',
    labelFr: 'ID quelconque',
    labelEn: 'Some ID',
    editable: false,
    visible: false,
    multiple: false,
  };

  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  beforeEach(async () => {
    await resetDatabase();
    await resetElastic();
  });

  describe('As admin', () => {
    let adminToken;

    beforeAll(async () => {
      adminToken = await (new UsersService()).generateToken(adminUsername);
    });

    describe('Create new custom field', () => {
      it('#01 Should be able to create a custom field', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/custom-fields/${baseFieldData.id}`,
          data: baseFieldData,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Check API response
        expect(httpAppResponse).toHaveProperty('status', 201);

        const fieldFromResponse = httpAppResponse?.data;

        expect(fieldFromResponse).toMatchObject({
          ...baseFieldData,
          createdAt: expect.stringMatching(isoDatePattern),
          updatedAt: expect.stringMatching(isoDatePattern),
        });

        // Check DB state
        const fieldFromService = await customFieldsPrisma.findById(fieldFromResponse.id);
        const jsonifiedFieldFromService = JSON.parse(JSON.stringify(fieldFromService));
        expect(jsonifiedFieldFromService).toEqual(fieldFromResponse);
      });
    });
  });

  describe('As user', () => {
    let userToken;

    beforeEach(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await (new UsersService()).generateToken(userTest.username);
    });

    describe('Create new custom field', () => {
      it('#02 Should not be able to create a custom field', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/custom-fields/${baseFieldData.id}`,
          data: baseFieldData,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Check API response
        expect(httpAppResponse).toHaveProperty('status', 403);

        // Check DB state
        const customFields = await customFieldsPrisma.findMany();
        expect(customFields).toEqual([]);
      });
    });
  });

  describe('With invalid token', () => {
    describe('Create new custom field', () => {
      it('#03 Should not be able to create a custom field', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/custom-fields/${baseFieldData.id}`,
          data: baseFieldData,
          headers: {
            Authorization: 'Bearer: some-invalid-token',
          },
        });

        // Check API response
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Check DB state
        const fieldsFromService = await customFieldsPrisma.findMany();
        expect(fieldsFromService).toEqual([]);
      });
    });
  });

  describe('Without token', () => {
    describe('Create new custom field', () => {
      it('#04 Should not be able to create a custom field', async () => {
        const httpAppResponse = await ezmesure({
          method: 'PUT',
          url: `/custom-fields/${baseFieldData.id}`,
          data: baseFieldData,
        });

        // Check API response
        expect(httpAppResponse).toHaveProperty('status', 401);

        // Check DB state
        const fieldsFromService = await customFieldsPrisma.findMany();
        expect(fieldsFromService).toEqual([]);
      });
    });
  });
});
