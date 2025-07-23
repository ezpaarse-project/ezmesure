const config = require('config');
const { CronJob } = require('cron');

const prisma = require('../prisma');
const { appLogger } = require('../logger');
const kibana = require('../kibana');
const assets = require('../assets');

const RepositoriesService = require('../../entities/repositories.service');
const SpacesService = require('../../entities/spaces.service');
const ElasticRoleService = require('../../entities/elastic-roles.service');

const { syncUser } = require('./elastic/users');

const {
  generateRoleNameFromSpace,
  generateKibanaFeatures,
  generateElasticPermissions,
} = require('../../hooks/utils');

const { execThrottledPromises } = require('../promises');

const { syncSchedule, dateFormat } = config.get('kibana');

/**
 * @typedef {import('../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('@prisma/client').Space} Space
 * @typedef {import('@prisma/client').Repository} Repository
 */

/**
 * @param {Space} space
 *
 * @returns {Promise<string | undefined>}
 */
const getSpaceLogo = async (space) => {
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
      const { data } = await kibana.createIndexPattern(space.id, {
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
  };

  const spaceExists = (await kibana.getSpace(space.id)).status !== 404;

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

const sync = async () => {
  await syncSpaces();
  await syncCustomRoles();
};

/**
 * Start cron to periodically sync Kibana to ezMESURE
 */
const startCron = async () => {
  const job = CronJob.from({
    cronTime: syncSchedule,
    runOnInit: true,
    onTick: async () => {
      appLogger.verbose('[kibana] Starting synchronization');
      try {
        await sync();
        appLogger.info('[kibana] Synchronized');
      } catch (e) {
        const message = e?.response?.data?.content?.message || e.message;
        appLogger.error(`[kibana] Failed to synchronize: ${message}`);
      }
    },
  });

  job.start();
};

module.exports = {
  startCron,
  sync,
  getSpaceLogo,
  syncIndexPatterns,
  syncSpace,
  syncSpaces,
  unmountSpace,
  syncCustomRole,
  syncCustomRoles,
  unmountCustomRole,
};
