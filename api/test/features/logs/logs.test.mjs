import {
  describe, it, expect, beforeEach, beforeAll, afterEach, afterAll,
} from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import config from 'config';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';
import { signJWT } from '../../../lib/utils/jwt';

import indicesPrisma from '../../../lib/services/elastic/indices';
import usersPrisma from '../../../lib/services/prisma/users';
import usersElastic from '../../../lib/services/elastic/users';

const logDir = path.resolve(__dirname, '..', '..', 'sources', 'log');

const adminUsername = config.get('admin.username');

describe('[logs]: Test insert features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const indexName = 'index-text';
  describe('As admin', () => {
    let adminToken;
    beforeAll(async () => {
      await resetDatabase();
      await resetElastic();
      adminToken = await signJWT({ username: adminUsername });
      await indicesPrisma.create(indexName, null, { ignore: [404] });
    });
    describe(`Add [wiley.csv] in [${indexName}] index`, () => {
      it(`#01 Should upload ec in index [${indexName}]`, async () => {
        const pathFile = path.resolve(logDir, 'wiley.csv');

        const httpAppResponse = await ezmesure.raw(`/logs/${indexName}`, {
          method: 'POST',
          body: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        expect(httpAppResponse).toHaveProperty('status', 200);

        const { _data: data } = httpAppResponse;

        expect(data).toHaveProperty('total', 6);
        expect(data).toHaveProperty('inserted', 5);
        expect(data).toHaveProperty('updated', 1);
        expect(data).toHaveProperty('failed', 0);
        expect(data).toHaveProperty('errors', []);
        expect(data).toHaveProperty('took');
        expect(data?.took).toBeGreaterThan(0);
      });

      afterAll(async () => {
        await indicesPrisma.removeAll();
      });
    });
  });
  describe('As user', () => {
    let userToken;

    beforeEach(async () => {
      await usersPrisma.create({ data: userTest });
      await usersElastic.createUser(userTest);
      userToken = await signJWT({ username: userTest.username });
    });
    // TODO create roles
    describe(`Add [wiley.csv] in [${indexName}] index who has roles`, () => {
      beforeAll(async () => {
        await indicesPrisma.create(indexName, null, { ignore: [404] });
      });

      it(`#02 Should not upload ec in index [${indexName}]`, async () => {
        const pathFile = path.resolve(logDir, 'wiley.csv');

        const httpAppResponse = await ezmesure.raw(`/logs/${indexName}`, {
          method: 'POST',
          body: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        expect(httpAppResponse).toHaveProperty('status', 403);
      });

      afterAll(async () => {
        await indicesPrisma.removeAll();
      });
    });

    describe(`Add [wiley.csv] in [${indexName}] index who has roles`, () => {
      beforeAll(async () => {
        await indicesPrisma.create(indexName, null, { ignore: [404] });
      });

      it(`#03 Should not upload ec in index [${indexName}]`, async () => {
        const pathFile = path.resolve(logDir, 'wiley.csv');

        const httpAppResponse = await ezmesure.raw(`/logs/${indexName}`, {
          method: 'POST',
          body: await fs.readFile(pathFile, 'utf-8'),
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        expect(httpAppResponse).toHaveProperty('status', 403);
      });

      afterAll(async () => {
        await indicesPrisma.removeAll();
      });
    });
    afterEach(async () => {
      await usersPrisma.removeAll();
    });
  });
  describe('With random token', () => {
    beforeAll(async () => {
      await indicesPrisma.create(indexName, null, { ignore: [404] });
    });

    it(`#04 Should not upload ec in index [${indexName}]`, async () => {
      const pathFile = path.resolve(logDir, 'wiley.csv');

      const httpAppResponse = await ezmesure.raw(`/logs/${indexName}`, {
        method: 'POST',
        body: await fs.readFile(pathFile, 'utf-8'),
        headers: {
          Authorization: 'Bearer: random',
        },
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await indicesPrisma.removeAll();
    });
  });
  describe('Without token', () => {
    beforeAll(async () => {
      await indicesPrisma.create(indexName, null, { ignore: [404] });
    });

    it(`#05 Should not upload ec in index [${indexName}]`, async () => {
      const pathFile = path.resolve(logDir, 'wiley.csv');

      const httpAppResponse = await ezmesure.raw(`/logs/${indexName}`, {
        method: 'POST',
        body: await fs.readFile(pathFile, 'utf-8'),
      });

      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    afterAll(async () => {
      await indicesPrisma.removeAll();
    });
  });
  afterAll(async () => {
    await resetDatabase();
    await resetElastic();
  });
});
