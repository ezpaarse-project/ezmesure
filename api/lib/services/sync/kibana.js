const config = require('config');
const { parseISO, isAfter, isValid: isValidDate } = require('date-fns');

const prisma = require('../prisma');
const { appLogger } = require('../logger');
const kibana = require('../kibana');
const assets = require('../assets');

const RepositoriesService = require('../../entities/repositories.service');
const SpacesService = require('../../entities/spaces.service');
const SpaceDashboardCollectionsService = require('../../entities/space-dashboard-collection.service');
const ElasticRoleService = require('../../entities/elastic-roles.service');

const savedObjectsNamespace = 'generic:';

const { syncUser } = require('./elastic/users');

const {
  generateRoleNameFromSpace,
  generateKibanaFeatures,
  generateElasticPermissions,
} = require('../../hooks/utils');

const { execThrottledPromises } = require('../promises');

const { dateFormat } = config.get('kibana');

/**
 * @typedef {import('../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('../../.prisma/client.mjs').Space} Space
 * @typedef {import('../../.prisma/client.mjs').Repository} Repository
 */

/**
 * @param {Space} space
 *
 * @returns {Promise<string | undefined>}
 */
const getSpaceLogo = async (space) => {
  if (space.imageUrl) {
    return space.imageUrl;
  }

  let data;
  switch (space.type) {
    case 'counter5':
      data = await assets.loadAsset('counter.png');
      break;
    case 'ezpaarse':
      data = await assets.loadAsset('ezpaarse.png');
      break;

    default:
      break;
  }

  return data && `data:image/png;base64,${data}`;
};

/**
 * Sync index patterns for a given space, based on repositories of the same type
 * @param {Space} space - The space we want to sync index patterns
 */
const syncIndexPatterns = async (space) => {
  const repositoriesService = new RepositoriesService();
  const repositories = await repositoriesService.findMany({
    where: {
      type: space.type,
      institutions: {
        some: { id: space.institutionId },
      },
    },
  });

  if (repositories.length === 0) {
    appLogger.verbose(`[kibana] No repositories to sync with space [${space.id}]`);
    return;
  }

  const indexPatterns = await kibana.getIndexPatterns({ spaceId: space.id, perPage: 10000 });
  const defaultIndexPatternId = await kibana.getDefaultIndexPattern(space.id);
  let firstPatternId = indexPatterns?.[0]?.id;

  await Promise.allSettled(repositories.map(async (repo) => {
    const existingPattern = indexPatterns.find((i) => i?.title === repo.pattern);

    if (existingPattern) {
      appLogger.verbose(`[kibana] Index pattern [${repo.pattern}] already exist in space [${space.id}]`);
      return;
    }

    try {
      const data = await kibana.createIndexPattern(space.id, {
        title: repo.pattern,
        timeFieldName: repo.type === 'counter5' ? 'X_Date_Month' : 'datetime',
      });

      if (!firstPatternId) { firstPatternId = data?.id; }

      appLogger.verbose(`[kibana] Index pattern [${repo.pattern}] has been created in space [${space.id}]`);
    } catch (error) {
      appLogger.error(`[kibana] Index pattern [${repo.pattern}] failed to be created in space [${space.id}]:\n${error}`);
    }
  }));

  const defaultPatternExists = (
    defaultIndexPatternId && indexPatterns.find((i) => i?.id === defaultIndexPatternId)
  );

  if (!defaultPatternExists && firstPatternId) {
    try {
      await kibana.setDefaultIndexPattern(space.id, firstPatternId);
      appLogger.verbose(`[kibana] Default index pattern set to [${firstPatternId}] has been created in space [${space.id}]`);
    } catch (error) {
      appLogger.error(`[kibana] Default index pattern [${firstPatternId}] failed to be created in space [${space.id}]:\n${error}`);
    }
  }
};

/**
 * Sync dashboards for a given space
 * @param {Space} spaceToSync - The space we want to sync
 */
const syncDashboards = async (spaceToSync) => {
  const space = await (new SpacesService()).findUnique({
    where: { id: spaceToSync.id },
    include: {
      dashboardCollections: {
        include: {
          collection: {
            include: {
              dashboards: true,
            },
          },
        },
      },
    },
  });

  if (!space) {
    appLogger.verbose(`[kibana] Space ${spaceToSync.id} does not exist anymore, ignoring dashboard sync`);
    return;
  }

  if (space.dashboardCollections.length === 0) {
    appLogger.verbose(`[kibana] No collection to sync with space [${space.id}]`);
    return;
  }

  const kibanaExport = await kibana.exportObjects({ type: 'dashboard', spaceId: space.id });

  if (!kibanaExport) {
    appLogger.verbose(`[kibana] Unable to get objects of ${spaceToSync.id}`);
    return;
  }

  const currentDashboards = kibanaExport.split('\n').map((line) => JSON.parse(line)).filter(
    (obj) => obj?.id?.startsWith?.(savedObjectsNamespace),
  );

  const indexPatterns = await kibana.getIndexPatterns({
    spaceId: space.id,
    perPage: 1000,
  });

  const dashboardUpdateDates = new Map(
    currentDashboards.map((o) => [o.id, parseISO(o.updated_at)]),
  );

  const isOutdatedDashboard = (dashboard, importedAt) => {
    if (!isValidDate(importedAt)) {
      // The collection has no import date, consider it outdated
      return true;
    }

    const objectId = `${savedObjectsNamespace}${dashboard.id}`;
    const objectUpdatedAt = dashboardUpdateDates.get(objectId);

    if (!isValidDate(objectUpdatedAt)) {
      // The dashboard saved object is missing or has an invalid update date,
      // so consider it outdated
      return true;
    }

    if (objectUpdatedAt - importedAt > 0) {
      // The saved object has been updated since the last import, so consider it dirty
      return true;
    }

    return isAfter(dashboard.updatedAt, importedAt);
  };

  /**
   * Remove duplicates from a list of saved objects, to limit unnecessary imports
   * @param {object[]} objects - The objects to be imported
   * @returns {object[]}
   */
  const toUniqueObjects = (objects) => {
    const ids = new Set();

    return objects.filter((obj) => {
      if (!obj.id) { return true; }
      if (ids.has(obj.id)) { return false; }

      ids.add(obj.id);
      return true;
    });
  };

  /**
   * Get the dashboard data with a modified dashboard saved object
   * @param {Dashbard} dashboard - The dashboard we want to get the objects
   * @returns {object[]} The objects to be imported
   */
  const getNamespacedDashboardData = (dashboard) => {
    if (!Array.isArray(dashboard?.data)) { return []; }

    return dashboard.data.map((obj) => {
      if (obj?.type === 'dashboard') {
        return { ...obj, id: `${savedObjectsNamespace}${dashboard.id}` };
      }
      return obj;
    });
  };

  /**
   * Patches import objects in order to replace index-pattern references with the given pattern ID
   * @param {Object[]} importObjects objects to import into Kibana
   * @param {String} patternId the ID of the index pattern that will replace the current references
   * @returns {Object[]}
   */
  const patchIndexPattern = (importObjects, patternId) => (
    importObjects
      // Removes index-pattern objects
      .filter((obj) => obj.type !== 'index-pattern')
      // Replaces the ID of all index-pattern references with the requested one
      .map((obj) => ({
        ...obj,
        references: !Array.isArray(obj.references) ? obj.references : obj.references.map((ref) => ({
          ...ref,
          id: ref.type === 'index-pattern' ? patternId : ref.id,
        })),
      }))
  );

  /**
   * Remove dashboards that were loaded by ezMESURE and should not be present anymore
   */
  const removeExtraneousDashboards = async () => {
    const extraneousDashboardIds = new Set(currentDashboards.map((o) => o.id));

    space.dashboardCollections.forEach(({ collection }) => {
      collection.dashboards.forEach((dashboard) => {
        extraneousDashboardIds.delete(`${savedObjectsNamespace}${dashboard.id}`);
      });
    });

    if (extraneousDashboardIds.size > 0) {
      const results = await Promise.allSettled(
        Array.from(extraneousDashboardIds).map(
          (id) => kibana.deleteSavedObject({ id, type: 'dashboard' }, { spaceId: space.id }),
        ),
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const errorCount = results.filter((result) => result.status === 'rejected').length;

      if (errorCount > 0) {
        appLogger.warn(`[kibana] ${errorCount} extraneous dashboards could not be purged from space [${space.id}]`);
      }
      appLogger.verbose(`[kibana] Purged ${successCount} extraneous dashboards from space [${space.id}]`);
    }
  };

  const syncSpaceCollection = async (dashboardCollection) => {
    const { collection, repositoryPattern, importedAt } = dashboardCollection;

    const indexPatternId = indexPatterns.find((p) => p.title === repositoryPattern)?.id;

    if (!indexPatternId) {
      const cause = `index pattern [${repositoryPattern}] does not exist`;
      appLogger.error(`[kibana] Collection [${collection.name}] cannot be imported into space [${space.id}]: ${cause}`);
      return;
    }

    const hasOutdatedDashboards = collection.dashboards.some(
      (dashboard) => isOutdatedDashboard(dashboard, importedAt),
    );

    if (!hasOutdatedDashboards) {
      appLogger.verbose(`[kibana] Collection [${collection.name}] has no updated dashboards for space [${space.id}]`);
      return;
    }

    const allObjects = patchIndexPattern(
      toUniqueObjects(collection.dashboards.flatMap(getNamespacedDashboardData)),
      indexPatternId,
    );

    try {
      const data = await kibana.importObjects(allObjects, {
        spaceId: space.id,
        overwrite: true,
      });

      const successCount = data?.successCount ?? 0;
      const warningCount = data?.warnings?.length ?? 0;
      const errorsCount = data?.errors?.length ?? 0;

      const stats = `${successCount} success, ${warningCount} warnings, ${errorsCount} errors`;

      if (data?.success === true) {
        appLogger.verbose(`[kibana] Collection [${collection.name}] has been imported into space [${space.id}] (${stats})`);
      } else {
        data?.errors?.forEach((err) => { appLogger.error(`[kibana] ${JSON.stringify(err, null, 2)}`); });
        appLogger.error(`[kibana] Collection [${collection.name}] has been imported into space [${space.id}] (${stats})`);
      }
    } catch (error) {
      appLogger.error(`[kibana] Collection [${collection.name}] failed to be imported into space [${space.id}]:\n${error}`);
    }

    await (new SpaceDashboardCollectionsService()).update({
      where: {
        collectionId_spaceId_repositoryPattern: {
          spaceId: space.id,
          collectionId: collection.id,
          repositoryPattern,
        },
      },
      data: {
        importedAt: new Date(),
      },
    });
  };

  await Promise.allSettled(
    space.dashboardCollections.map(syncSpaceCollection),
  );

  try {
    await removeExtraneousDashboards();
  } catch (error) {
    appLogger.error(`[kibana] Failed to remove extraneous dashboards from space [${space.id}]:\n${error}`);
  }
};

/**
 * Sync Kibana's spaces and roles to ezMESURE's spaces
 */
const syncSpace = async (space) => {
  const spaceParams = {
    id: space.id,
    name: space.name,
    description: space.description || undefined,
    initials: space.initials || undefined,
    color: space.color || undefined,
    imageUrl: await getSpaceLogo(space),
    disabledFeatures: space.disabledFeatures,
  };

  const spaceExists = !!(await kibana.getSpace(space.id));

  if (spaceExists) {
    await kibana.updateSpace(spaceParams);
  } else {
    await kibana.createSpace(spaceParams);
  }

  try {
    await kibana.updateSpaceSettings({
      id: space.id,
      changes: {
        'csv:separator': ';',
        dateFormat,
      },
    });
    appLogger.verbose(`[kibana] Default settings set in space [${space.id}]`);
  } catch (error) {
    appLogger.verbose(`[kibana] Default settings failed to be applied in space [${space.id}]:\n${error}`);
  }

  await kibana.putRole(
    generateRoleNameFromSpace(space, 'readonly'),
    new Map([[space.id, generateKibanaFeatures({ readonly: true })]]),
  );

  await kibana.putRole(
    generateRoleNameFromSpace(space, 'all'),
    new Map([[space.id, generateKibanaFeatures({ readonly: false })]]),
  );

  await syncIndexPatterns(space);

  await syncDashboards(space);
};

/**
 * Sync Kibana's spaces and roles to ezMESURE's spaces
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncSpaces = async () => {
  const spacesService = new SpacesService();
  const spaces = await spacesService.findMany({});

  const executors = spaces.map((space) => () => syncSpace(space));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[kibana] Error on upserting spaces and spaces roles: ${error.message}`),
  );

  appLogger.verbose(`[kibana] Upserted ${res.fulfilled} spaces and ${res.fulfilled * 2} spaces roles (${res.errors} errors)`);

  return res;
};

/**
 * Delete a space and remove roles associated with it
 */
const unmountSpace = async (space) => {
  try {
    await kibana.deleteSpace(space.id);
    appLogger.verbose(`[kibana] Space [${space.id}] is deleted`);
  } catch (error) {
    if (error.response?.status !== 404) {
      appLogger.error(`[kibana] Space [${space.id}] cannot be deleted: ${error.message}`);
    }
    return;
  }

  const readonlyRole = generateRoleNameFromSpace(space, 'readonly');
  try {
    await kibana.deleteRole(readonlyRole);
    appLogger.verbose(`[kibana] Role [${readonlyRole}] is deleted`);
  } catch (error) {
    if (error.response?.status !== 404) {
      appLogger.error(`[kibana] Role [${readonlyRole}] cannot be deleted: ${error.message}`);
    }
  }

  const allRole = generateRoleNameFromSpace(space, 'all');
  try {
    await kibana.deleteRole(allRole);
    appLogger.verbose(`[kibana] Role [${allRole}] is deleted`);
  } catch (error) {
    if (error.response?.status !== 404) {
      appLogger.error(`[kibana] Role [${allRole}] cannot be deleted: ${error.message}`);
    }
  }
};

/**
 * Sync a custom role in kibana
 *
 * @param {string} roleName - The role to sync
 * @returns {Promise<void>}
 */
async function syncCustomRole(roleName) {
  const role = await prisma.client.elasticRole.findUnique({
    where: { name: roleName },
    include: {
      repositoryPermissions: true,
      repositoryAliasPermissions: true,
      spacePermissions: true,
      users: true,
      institutions: {
        include: { memberships: true },
      },
    },
  });
  if (!role) {
    appLogger.error(`[kibana] Cannot create custom role [${roleName}], role not found`);
    return;
  }

  try {
    /** @type {[string, { privileges: string[] }][]} */
    const repositoryPermissions = role.repositoryPermissions.map(
      (p) => [p.repositoryPattern, generateElasticPermissions(p)],
    );
    /** @type {[string, { privileges: string[] }][]} */
    const aliasPermissions = role.repositoryAliasPermissions.map(
      (p) => [p.aliasPattern, generateElasticPermissions({ readonly: true })],
    );
    /** @type {[string, { features: Record<string, string[]> }][]} */
    const spacePermissions = role.spacePermissions.map(
      (p) => [p.spaceId, generateKibanaFeatures(p)],
    );

    await kibana.putRole(
      role.name,
      new Map(spacePermissions),
      new Map([...repositoryPermissions, ...aliasPermissions]),
    );
    appLogger.verbose(`[kibana] Role [${role.name}] has been upserted`);
  } catch (error) {
    appLogger.error(`[kibana] Role [${role.name}] cannot be upserted:\n${error}`);
  }

  try {
    const usernamesToSync = new Set(
      [...role.users, ...role.institutions.flatMap((i) => i.memberships)]
        .map(({ username }) => username),
    );

    const usersToSync = await prisma.client.user.findMany({
      where: { username: { in: Array.from(usernamesToSync) } },
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const user of usersToSync) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await syncUser(user);
        appLogger.verbose(`[kibana] Roles of user [${user.username}] for [${role.name}] has been synced`);
      } catch (err) {
        appLogger.error(`[kibana] Couldn't sync roles of [${user.username}] for [${role.name}]:\n${err}`);
      }
    }
  } catch (error) {
    appLogger.error(`[kibana] Couldn't sync roles of users for [${role.name}]:\n${error}`);
  }
}

/**
 * Sync all custom roles in kibana
 *
 * @returns {Promise<ThrottledPromisesResult>}
 */
async function syncCustomRoles() {
  const elasticRoleService = new ElasticRoleService();
  const roles = await elasticRoleService.findMany({});

  const executors = roles.map((role) => () => syncCustomRole(role.name));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[kibana] Error on upserting custom roles: ${error.message}`),
  );
  appLogger.verbose(`[kibana] Upserted ${res.fulfilled} custom roles (${res.errors} errors)`);

  return res;
}

/**
 * Delete custom role in kibana
 *
 * @param {string} roleName - The role to sync
 * @returns {Promise<void>}
 */
async function unmountCustomRole(roleName) {
  try {
    await kibana.deleteRole(roleName);
    appLogger.verbose(`[kibana] Role [${roleName}] has been deleted`);
  } catch (error) {
    appLogger.error(`[kibana] Role [${roleName}] cannot be deleted:\n${error}`);
  }
}

module.exports = {
  getSpaceLogo,

  syncIndexPatterns,

  syncSpace,
  syncSpaces,
  unmountSpace,

  syncCustomRole,
  syncCustomRoles,
  unmountCustomRole,
};
