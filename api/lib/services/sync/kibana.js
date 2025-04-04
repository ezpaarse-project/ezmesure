const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../logger');
const kibana = require('../kibana');
const assets = require('../assets');

const RepositoriesService = require('../../entities/repositories.service');
const SpacesService = require('../../entities/spaces.service');

const {
  generateRoleNameFromSpace,
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

  await kibana.putRole({
    name: generateRoleNameFromSpace(space, 'readonly'),
    body: {
      kibana: [
        {
          spaces: [space.id],
          feature: {
            discover: ['read'],
            dashboard: ['read'],
            canvas: ['read'],
            maps: ['read'],
            visualize: ['read'],
          },
        },
      ],
    },
  });

  await kibana.putRole({
    name: generateRoleNameFromSpace(space, 'all'),
    body: {
      kibana: [
        {
          spaces: [space.id],
          feature: {
            discover: ['all'],
            dashboard: ['all'],
            canvas: ['all'],
            maps: ['all'],
            visualize: ['all'],

            indexPatterns: ['all'],
            savedObjectsTagging: ['all'],
          },
        },
      ],
    },
  });

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

const sync = async () => {
  await syncSpaces();
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
};
