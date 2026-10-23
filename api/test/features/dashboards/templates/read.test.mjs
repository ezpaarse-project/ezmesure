import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from 'vitest';

import ezmesure from '../../../setup/ezmesure';

import { resetDatabase } from '../../../../lib/services/prisma/utils';
import { resetElastic } from '../../../../lib/services/elastic/utils';
import { signJWT } from '../../../../lib/utils/jwt';

import usersPrisma from '../../../../lib/services/prisma/users';
import dashboardsPrisma from '../../../../lib/services/prisma/dashboards';

describe('[dashboard-templates] Read features', () => {
  const adminUser = {
    username: 'admin.user',
    email: 'admin@test.fr',
    fullName: 'Admin',
    isAdmin: true,
  };

  const testUser = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };

  const testDashboards = [
    {
      id: 'test-dashboard-1',
      sourceSpaceId: 'source-space-1',
      sourceDashboardId: 'source-dashboard-1',
    },
    {
      id: 'test-dashboard-2',
      sourceSpaceId: 'source-space-2',
      sourceDashboardId: 'source-dashboard-2',
    },
  ];

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
  });

  beforeEach(async () => {
    await dashboardsPrisma.removeAll();
    await Promise.all(
      testDashboards.map((dashboard) => dashboardsPrisma.create({ data: dashboard })),
    );
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await signJWT({ username: adminUser.username });
    });

    it('#01 Should be able to list dashboard templates', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-templates', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        _data: expect.arrayContaining(
          testDashboards.map((dashboard) => expect.objectContaining(dashboard)),
        ),
      });

      const { _data: dashboardFromResponse } = httpAppResponse;

      expect(dashboardFromResponse).toHaveLength(2);
    });

    it('#02 Should be able to get a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-templates/${testDashboards[1].id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      const { _data: dashboardFromResponse } = httpAppResponse;
      expect(dashboardFromResponse).toMatchObject(testDashboards[1]);
    });
  });

  describe('An authenticated user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: testUser });
      userToken = await signJWT({ username: testUser.username });
    });

    it('#03 Should be able to list dashboard templates', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-templates', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        _data: expect.arrayContaining(testDashboards.map((role) => expect.objectContaining(role))),
      });
      const { _data: dashboardFromResponse } = httpAppResponse;
      expect(dashboardFromResponse).toHaveLength(2);
    });

    it('#04 Should be able to get a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-templates/${testDashboards[1].id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      const { _data: dashboardFromResponse } = httpAppResponse;
      expect(dashboardFromResponse).toMatchObject(testDashboards[1]);
    });
  });

  describe('An unauthenticated user', () => {
    it('#05 Should not be able to list dashboard templates', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-templates', {
        method: 'GET',
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);
    });

    it('#06 Should not be able to get a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-templates/${testDashboards[1].id}`, {
        method: 'GET',
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);
    });
  });
});
