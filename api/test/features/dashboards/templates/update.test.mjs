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
import collectionsPrisma from '../../../../lib/services/prisma/dashboard-collections';

const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;

describe('[dashboard-templates] Update features', () => {
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

  const testCollection = {
    id: 'col-1',
    name: 'Awesome collection',
    description: 'Some awesome collection with plenty of awesome dashboards',
  };

  const testDashboard = {
    id: 'dashboard-1',
    sourceSpaceId: 'source-space-id',
    sourceDashboardId: 'source-dashboard-id',
  };

  const updatedDashboard = {
    id: 'dashboard-1',
    sourceSpaceId: 'source-space-id',
    sourceDashboardId: 'source-dashboard-id',
    collectionId: 'col-1',
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
  });

  beforeEach(async () => {
    await dashboardsPrisma.removeAll();
    await collectionsPrisma.removeAll();
    await dashboardsPrisma.create({ data: testDashboard });
    await collectionsPrisma.create({ data: testCollection });
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await signJWT({ username: adminUser.username });
    });

    it('#01 Should be able to update a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-templates/${testDashboard.id}`, {
        method: 'PATCH',
        body: updatedDashboard,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);

      const { _data: dashboardFromResponse } = httpAppResponse;

      expect(dashboardFromResponse).toMatchObject({
        ...updatedDashboard,
        createdAt: expect.stringMatching(isoDatePattern),
        updatedAt: expect.stringMatching(isoDatePattern),
      });

      // Check DB state
      const dashboardFromService = await dashboardsPrisma.findById(dashboardFromResponse.id);
      const jsonifiedDashboardFromService = JSON.parse(JSON.stringify(dashboardFromService));
      expect(jsonifiedDashboardFromService).toEqual(dashboardFromResponse);
    });
  });

  describe('An authenticated user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: testUser });
      userToken = await signJWT({ username: testUser.username });
    });

    it('#02 Should not be able to update a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-templates/${testDashboard.id}`, {
        method: 'PATCH',
        body: updatedDashboard,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 403);

      // Check DB state
      const dashboardFromService = await dashboardsPrisma.findById(testDashboard.id);
      expect(dashboardFromService).toMatchObject(testDashboard);
    });
  });

  describe('An unauthenticated user', () => {
    it('#03 Should not be able to update a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw(`/dashboard-templates/${testDashboard.id}`, {
        method: 'PATCH',
        body: updatedDashboard,
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Check DB state
      const dashboardFromService = await dashboardsPrisma.findById(testDashboard.id);
      expect(dashboardFromService).toMatchObject(testDashboard);
    });
  });
});
