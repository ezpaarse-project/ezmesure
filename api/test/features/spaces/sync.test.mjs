import {
  describe,
  it,
  expect,
  beforeAll,
} from 'vitest';
import path from 'node:path';
import fs from 'node:fs';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import {
  deleteSpace,
  getSpace,
  getIndexPatterns,
  exportObjects,
} from '../../../lib/services/kibana';
import { syncSpace } from '../../../lib/services/sync/kibana';

import spacesPrisma from '../../../lib/services/prisma/spaces';
import institutionsPrisma from '../../../lib/services/prisma/institutions';
import dashboardsPrisma from '../../../lib/services/prisma/dashboards';
import collectionsPrisma from '../../../lib/services/prisma/dashboard-collections';

const kibanaExportFile = path.resolve(__dirname, '../../sources/kibana/dashboard.ndjson');
const dashboardData = fs.readFileSync(kibanaExportFile, { encoding: 'utf8' }).split('\n').map(JSON.parse);

describe('[space] Sync features', () => {
  const testInstitution = {
    id: 'test-institution-id',
    name: 'Test',
  };

  const testRepository = {
    pattern: 'test-publisher*',
    type: 'counter5',
  };

  const testSpace = {
    id: 'test-publisher-id',
    type: 'counter5',
    name: 'test-publisher-name',
    description: 'COUNTER space for test institution',
    initials: 'EZ',
  };

  const testCollection = {
    id: 'test-collection-id',
    name: 'Awesome collection',
    description: 'Some awesome collection with plenty of awesome dashboards',
  };

  const testDashboard = {
    id: 'test-dashboard-id',
    sourceSpaceId: testSpace.id,
    sourceDashboardId: 'test-dashboard',
    name: 'Obsolete name',
    description: 'Obsolete description',
    kibanaVersion: '7.0.0',
    tags: [{ attributes: { color: '#d615f6', description: '', name: 'obsolete tag' } }],
    data: dashboardData,
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    await deleteSpace(testSpace.id);

    await collectionsPrisma.create({
      data: testCollection,
    });
    await dashboardsPrisma.create({
      data: {
        ...testDashboard,
        collection: { connect: { id: testCollection.id } },
      },
    });
    await institutionsPrisma.create({
      data: {
        ...testInstitution,
        repositories: { create: testRepository },
      },
    });
    await spacesPrisma.create({
      data: {
        ...testSpace,
        institution: {
          connect: { id: testInstitution.id },
        },
        dashboardCollections: {
          create: {
            collectionId: testCollection.id,
            repositoryPattern: testRepository.pattern,
          },
        },
      },
    });
  });

  describe('A space', () => {
    it('#01 Should properly sync with Kibana', { timeout: 15000 }, async () => {
      const dbSpace = await spacesPrisma.findByID(testSpace.id);
      await syncSpace(dbSpace); // FIXME: hide logging

      // Check space
      const kibanaSpace = await getSpace(testSpace.id);
      const { type, ...testSpaceWithoutType } = testSpace;
      expect(kibanaSpace).toMatchObject(testSpaceWithoutType);

      // Check index pattern
      const indexPatterns = await getIndexPatterns({ spaceId: testSpace.id });
      expect(indexPatterns).toEqual([expect.objectContaining({ title: testRepository.pattern })]);

      // Check dashboards
      const kibanaExport = await exportObjects({
        excludeExportDetails: true,
        includeReferencesDeep: true,
        spaceId: testSpace.id,
        type: 'dashboard',
      });
      const exportedObjects = kibanaExport?.split('\n').map(JSON.parse);
      expect(exportedObjects).toMatchObject(expect.arrayContaining([
        expect.objectContaining({ type: 'index-pattern' }),
        expect.objectContaining({ type: 'lens' }),
        expect.objectContaining({ type: 'tag' }),
        expect.objectContaining({ type: 'dashboard', id: `generic:${testDashboard.id}` }),
      ]));
    });
  });
});
