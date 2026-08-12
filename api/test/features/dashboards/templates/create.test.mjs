import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from 'vitest';
import path from 'node:path';
import fsp from 'node:fs/promises';

import ezmesure from '../../../setup/ezmesure';

import { resetDatabase } from '../../../../lib/services/prisma/utils';
import { resetElastic } from '../../../../lib/services/elastic/utils';
import { createSpace, deleteSpace, importObjects } from '../../../../lib/services/kibana';
import { signJWT } from '../../../../lib/utils/jwt';

import usersPrisma from '../../../../lib/services/prisma/users';
import dashboardsPrisma from '../../../../lib/services/prisma/dashboards';

const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;

const kibanaExportFile = path.resolve(__dirname, '../../../sources/kibana/dashboard.ndjson');

describe('[dashboard-templates] Create features', () => {
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

  const testDashboard = {
    sourceSpaceId: 'test-space',
    sourceDashboardId: 'test-dashboard',
  };

  const expectedCreatedDashboard = {
    sourceSpaceId: testDashboard.sourceSpaceId,
    sourceDashboardId: testDashboard.sourceDashboardId,
    name: 'Example dashboard',
    description: 'Very minimal dashboard for testing purpose',
    kibanaVersion: '7.14.1',
    tags: [{ attributes: { color: '#d615f6', description: '', name: 'test' } }],
    data: expect.arrayContaining([
      expect.objectContaining({ type: 'index-pattern' }),
      expect.objectContaining({ type: 'lens' }),
      expect.objectContaining({ type: 'tag' }),
      expect.objectContaining({ type: 'dashboard', id: testDashboard.sourceDashboardId }),
    ]),
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    await deleteSpace(testDashboard.sourceSpaceId);
    await createSpace({
      id: testDashboard.sourceSpaceId,
      name: 'Test Space',
      description: 'A space for testing purpose',
    });
    const dashboardFile = await fsp.readFile(kibanaExportFile);
    await importObjects(dashboardFile, { spaceId: testDashboard.sourceSpaceId, overwrite: true });
  });

  beforeEach(async () => {
    await dashboardsPrisma.removeAll();
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await signJWT({ username: adminUser.username });
    });

    it('#01 Should be able to create a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-templates', {
        method: 'POST',
        body: testDashboard,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 201);

      const { _data: dashboardFromResponse } = httpAppResponse;

      expect(dashboardFromResponse).toMatchObject({
        ...testDashboard,
        createdAt: expect.stringMatching(isoDatePattern),
        updatedAt: expect.stringMatching(isoDatePattern),
      });

      // Check DB state
      const dashboardFromService = await dashboardsPrisma.findById(dashboardFromResponse.id);
      const jsonifiedDashboardFromService = JSON.parse(JSON.stringify(dashboardFromService));
      expect(jsonifiedDashboardFromService).toEqual(dashboardFromResponse);

      // Check that the created dashboard has metadata extracted from Kibana
      expect(jsonifiedDashboardFromService).toMatchObject(expectedCreatedDashboard);
    });
  });

  describe('An authenticated user', () => {
    let userToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: testUser });
      userToken = await signJWT({ username: testUser.username });
    });

    it('#02 Should not be able to create a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-templates', {
        method: 'POST',
        body: testDashboard,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 403);

      // Check DB state
      const nbDashboards = await dashboardsPrisma.count();
      expect(nbDashboards).toEqual(0);
    });
  });

  describe('An unauthenticated user', () => {
    it('#03 Should not be able to create a dashboard template', async () => {
      const httpAppResponse = await ezmesure.raw('/dashboard-templates', {
        method: 'POST',
        body: testDashboard,
      });

      // Check API response
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Check DB state
      const nbDashboards = await dashboardsPrisma.count();
      expect(nbDashboards).toEqual(0);
    });
  });
});
