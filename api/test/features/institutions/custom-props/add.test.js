const config = require('config');

const ezmesure = require('../../../setup/ezmesure');

const institutionsPrisma = require('../../../../lib/services/prisma/institutions');
const customFieldsPrisma = require('../../../../lib/services/prisma/custom-fields');
const usersPrisma = require('../../../../lib/services/prisma/users');
const usersElastic = require('../../../../lib/services/elastic/users');
const UsersService = require('../../../../lib/entities/users.service');

const { resetDatabase } = require('../../../../lib/services/prisma/utils');
const { resetElastic } = require('../../../../lib/services/elastic/utils');

const adminUsername = config.get('admin.username');

describe('[institutions - custom-props] Add', () => {
  const customFieldData = {
    id: 'some-id',
    labelFr: 'ID quelconque',
    labelEn: 'Some ID',
    editable: false,
    visible: false,
    multiple: false,
  };

  const customProp = {
    fieldId: customFieldData.id,
    value: 'some-value',
  };

  const writePermissions = ['institution:write', 'institution:read'];

  let institution;

  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const institutionTest = {
    name: 'Test',
  };

  beforeEach(async () => {
    await resetDatabase();
    await resetElastic();

    await customFieldsPrisma.create({ data: customFieldData });
    institution = await institutionsPrisma.create({ data: institutionTest });
  });

  describe('An admin', () => {
    let adminToken;

    beforeEach(async () => {
      adminToken = await (new UsersService()).generateToken(adminUsername);
    });

    it('#01 Should be able to add a custom prop', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institution.id}`,
        data: {
          ...institutionTest,
          customProps: [customProp],
        },
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 200);

      // Check DB state
      const includes = { customProps: true };
      const institutionFromService = await institutionsPrisma.findByID(institution.id, includes);

      expect(institutionFromService).toHaveProperty('customProps', [expect.objectContaining(customProp)]);
    });
  });

  describe(`An institution member with permission [${writePermissions}]`, () => {
    let memberToken;

    beforeEach(async () => {
      await usersElastic.createUser(userTest);
      await usersPrisma.create({
        data: {
          ...userTest,
          memberships: {
            create: {
              institutionId: institution.id,
              permissions: writePermissions,
            },
          },
        },
      });

      memberToken = await (new UsersService()).generateToken(userTest.username);
    });

    it('#02 Should not be able to add a custom prop', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institution.id}`,
        data: {
          ...institutionTest,
          customProps: [customProp],
        },
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 200);

      // Check DB state
      const include = { customProps: true };
      const institutionFromService = await institutionsPrisma.findByID(institution.id, include);

      expect(institutionFromService).toHaveProperty('customProps', []);
    });
  });
});
