import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import config from 'config';

import ezmesure from '../../../setup/ezmesure';

import institutionsPrisma from '../../../../lib/services/prisma/institutions';
import customFieldsPrisma from '../../../../lib/services/prisma/custom-fields';
import usersPrisma from '../../../../lib/services/prisma/users';
import usersElastic from '../../../../lib/services/elastic/users';
import UsersService from '../../../../lib/entities/users.service';

import { resetDatabase } from '../../../../lib/services/prisma/utils';
import { resetElastic } from '../../../../lib/services/elastic/utils';

const adminUsername = config.get('admin.username');

describe('[institutions - custom-props] Remove', () => {
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
    customProps: {
      create: [customProp],
    },
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

    it('#01 Should be able to remove a custom prop', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${institution.id}`,
        data: {
          ...institutionTest,
          customProps: [],
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

      expect(institutionFromService).toHaveProperty('customProps', []);
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

    it('#02 Should not be able to remove a custom prop', async () => {
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

      expect(institutionFromService).toHaveProperty('customProps', [expect.objectContaining(customProp)]);
    });
  });
});
