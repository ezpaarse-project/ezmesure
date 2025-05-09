const config = require('config');

const ezmesure = require('../../setup/ezmesure');

const { resetDatabase } = require('../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../lib/services/elastic/utils');

const usersPrisma = require('../../../lib/services/prisma/users');
const usersElastic = require('../../../lib/services/elastic/users');
const UsersService = require('../../../lib/entities/users.service');
const customFieldsPrisma = require('../../../lib/services/prisma/custom-fields');

const adminUsername = config.get('admin.username');

describe('[repositories]: Test delete features', () => {
  const customFieldData = {
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

  let initialField;

  beforeEach(async () => {
    await resetDatabase();
    await resetElastic();
    initialField = await customFieldsPrisma.create({ data: customFieldData });
  });

  describe('As admin', () => {
    let adminToken;

    beforeAll(async () => {
      adminToken = await (new UsersService()).generateToken(adminUsername);
    });

    describe('Delete custom field', () => {
      it('#01 Should be able to delete a custom field', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/custom-fields/${customFieldData.id}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Check API response
        expect(res).toHaveProperty('status', 204);

        // Test service
        const repositoryFromService = await customFieldsPrisma.findMany();
        expect(repositoryFromService).toEqual([]);
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

    describe('Delete custom field', () => {
      it('#02 Should not be able to delete a custom field', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/custom-fields/${customFieldData.id}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Check API response
        expect(res).toHaveProperty('status', 403);

        // Check DB state
        const fieldFromService = await customFieldsPrisma.findById(customFieldData.id);
        expect(fieldFromService).toEqual(initialField);
      });
    });
  });

  describe('Without token', () => {
    describe('Delete custom field', () => {
      it('#03 Should not be able to delete a custom field', async () => {
        const res = await ezmesure({
          method: 'DELETE',
          url: `/custom-fields/${customFieldData.id}`,
        });

        // Check API response
        expect(res).toHaveProperty('status', 401);

        // Check DB state
        const fieldFromService = await customFieldsPrisma.findById(customFieldData.id);
        expect(fieldFromService).toEqual(initialField);
      });
    });
  });
});
