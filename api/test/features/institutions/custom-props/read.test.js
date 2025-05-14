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

describe('[institutions - custom-props] Read', () => {
  const visibleFieldData = {
    id: 'visible-field-id',
    labelFr: 'Champs visible',
    labelEn: 'Visible field',
    editable: false,
    visible: true,
    multiple: false,
  };

  const invisibleFieldData = {
    id: 'invisible-field-id',
    labelFr: 'Champ invisible',
    labelEn: 'Invisible field',
    editable: false,
    visible: false,
    multiple: false,
  };

  const visibleCustomProp = {
    fieldId: visibleFieldData.id,
    value: 'some-visible-value',
  };

  const invisibleCustomProp = {
    fieldId: invisibleFieldData.id,
    value: 'some-invisible-value',
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

    await customFieldsPrisma.create({ data: visibleFieldData });
    await customFieldsPrisma.create({ data: invisibleFieldData });

    institution = await institutionsPrisma.create({
      data: {
        ...institutionTest,
        customProps: {
          createMany: { data: [visibleCustomProp, invisibleCustomProp] },
        },
      },
    });
  });

  describe('An admin', () => {
    let adminToken;

    beforeEach(async () => {
      adminToken = await (new UsersService()).generateToken(adminUsername);
    });

    it('#01 Should be able view all custom props', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/institutions/${institution.id}`,
        params: {
          include: 'customProps',
        },
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse.data).toHaveProperty('customProps', [
        expect.objectContaining(visibleCustomProp),
        expect.objectContaining(invisibleCustomProp),
      ]);
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

    it('#02 Should be able to view visible custom props', async () => {
      const httpAppResponse = await ezmesure({
        method: 'GET',
        url: `/institutions/${institution.id}`,
        params: {
          include: 'customProps',
        },
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse.data).toHaveProperty('customProps', [
        expect.objectContaining(visibleCustomProp),
      ]);
    });
  });
});
