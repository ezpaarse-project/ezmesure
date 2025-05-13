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

describe('[institutions - custom-props] Update', () => {
  const editableCustomFieldData = {
    id: 'editable-field-id',
    labelFr: 'ID éditable',
    labelEn: 'Editable ID',
    editable: true,
    visible: false,
    multiple: false,
  };

  const readonlyCustomFieldData = {
    id: 'readonly-field-id',
    labelFr: 'ID en lecture seule',
    labelEn: 'Readonly ID',
    editable: false,
    visible: false,
    multiple: false,
  };

  const editableCustomProp = {
    fieldId: editableCustomFieldData.id,
    value: 'some-editable-value',
  };

  const readonlyCustomProp = {
    fieldId: readonlyCustomFieldData.id,
    value: 'some-readonly-value',
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
    customProps: {
      createMany: {
        data: [editableCustomProp, readonlyCustomProp],
      },
    },
  };

  beforeEach(async () => {
    await resetDatabase();
    await resetElastic();

    await customFieldsPrisma.create({ data: editableCustomFieldData });
    await customFieldsPrisma.create({ data: readonlyCustomFieldData });
    institution = await institutionsPrisma.create({ data: institutionTest });
  });

  describe('An admin', () => {
    let adminToken;

    beforeEach(async () => {
      adminToken = await (new UsersService()).generateToken(adminUsername);
    });

    it('#01 Should be able to update a readonly custom prop', async () => {
      const newReadonlyCustomProp = { ...readonlyCustomProp, value: 'new-readonly-value' };

      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institution.id}`,
        data: {
          ...institutionTest,
          customProps: [
            editableCustomProp,
            newReadonlyCustomProp,
          ],
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

      expect(institutionFromService).toHaveProperty('customProps', [
        expect.objectContaining(editableCustomProp),
        expect.objectContaining(newReadonlyCustomProp),
      ]);
    });

    it('#02 Should be able to update an editable custom prop', async () => {
      const newEditableCustomProp = { ...editableCustomProp, value: 'new-editable-value' };

      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institution.id}`,
        data: {
          ...institutionTest,
          customProps: [
            readonlyCustomProp,
            newEditableCustomProp,
          ],
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
      const customProps = institutionFromService?.customProps;

      expect(Array.isArray(customProps)).toBe(true);
      expect(customProps).toHaveLength(2);
      expect(customProps).toContainEqual(expect.objectContaining(readonlyCustomProp));
      expect(customProps).toContainEqual(expect.objectContaining(newEditableCustomProp));
    });
  });

  describe(`An institution member with permission [${writePermissions}]`, () => {
    let privilegedMemberToken;

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

      privilegedMemberToken = await (new UsersService()).generateToken(userTest.username);
    });

    it('#03 Should not be able to update readonly custom prop', async () => {
      const newReadonlyCustomProp = { ...readonlyCustomProp, value: 'new-readonly-value' };

      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institution.id}`,
        data: {
          ...institutionTest,
          customProps: [
            editableCustomProp,
            newReadonlyCustomProp,
          ],
        },
        headers: {
          Authorization: `Bearer ${privilegedMemberToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 200);

      // Check DB state
      const include = { customProps: true };
      const institutionFromService = await institutionsPrisma.findByID(institution.id, include);
      const customProps = institutionFromService?.customProps;

      expect(Array.isArray(customProps)).toBe(true);
      expect(customProps).toHaveLength(2);
      expect(customProps).toContainEqual(expect.objectContaining(editableCustomProp));
      expect(customProps).toContainEqual(expect.objectContaining(readonlyCustomProp));
    });

    it('#04 Should be able to update an editable custom prop', async () => {
      const newEditableCustomProp = { ...editableCustomProp, value: 'new-editable-value' };

      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institution.id}`,
        data: {
          ...institutionTest,
          customProps: [
            readonlyCustomProp,
            newEditableCustomProp,
          ],
        },
        headers: {
          Authorization: `Bearer ${privilegedMemberToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 200);

      // Check DB state
      const includes = { customProps: true };
      const institutionFromService = await institutionsPrisma.findByID(institution.id, includes);
      const customProps = institutionFromService?.customProps;

      expect(Array.isArray(customProps)).toBe(true);
      expect(customProps).toHaveLength(2);
      expect(customProps).toContainEqual(expect.objectContaining(newEditableCustomProp));
      expect(customProps).toContainEqual(expect.objectContaining(readonlyCustomProp));
    });
  });
});
