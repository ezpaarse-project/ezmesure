import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';
import UsersService from '../../../lib/entities/users.service';
import customFieldsPrisma from '../../../lib/services/prisma/custom-fields';

const adminUsername = config.get('admin.username');

const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;

describe('[custom-fields]: Test read features', () => {
  const customFieldData = {
    id: 'visible-field-id',
    labelFr: 'ID visible',
    labelEn: 'Visible ID',
    editable: false,
    visible: true,
    multiple: false,
  };

  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    await customFieldsPrisma.create({ data: customFieldData });
  });

  describe('As admin', () => {
    let adminToken;

    beforeAll(async () => {
      adminToken = await (new UsersService()).generateToken(adminUsername);
    });

    describe('Get custom field', () => {
      it('#01 Should get custom field', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/custom-fields/${customFieldData.id}`,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // Check API response
        expect(httpAppResponse).toHaveProperty('status', 200);

        const fieldFromResponse = httpAppResponse?.data;

        expect(fieldFromResponse).toMatchObject({
          ...customFieldData,
          createdAt: expect.stringMatching(isoDatePattern),
          updatedAt: expect.stringMatching(isoDatePattern),
        });
      });
    });
  });

  describe('As user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await (new UsersService()).generateToken(userTest.username);
    });

    describe('Get custom field', () => {
      it('#02 Should not get custom field', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/custom-fields/${customFieldData.id}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // Check API response
        expect(httpAppResponse).toHaveProperty('status', 403);
      });
    });
  });

  describe('With random user', () => {
    describe('Get custom field', () => {
      it('#03 Should not get custom field', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/custom-fields/${customFieldData.id}`,
          headers: {
            Authorization: 'Bearer: random',
          },
        });

        // Check API response
        expect(httpAppResponse).toHaveProperty('status', 401);
      });
    });
  });

  describe('Without token', () => {
    describe('Get custom field', () => {
      it('#04 Should not get custom field', async () => {
        const httpAppResponse = await ezmesure({
          method: 'GET',
          url: `/custom-fields/${customFieldData.id}`,
        });

        // Check API response
        expect(httpAppResponse).toHaveProperty('status', 401);
      });
    });
  });
});
