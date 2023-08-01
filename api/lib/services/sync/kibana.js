const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../logger');
const kibana = require('../kibana');

const SpacesService = require('../../entities/spaces.service');

const {
  generateRoleNameFromSpace,
} = require('../../hooks/utils');

const { execThrottledPromises } = require('../promises');

const { syncSchedule } = config.get('ezreeport');

/**
 * Sync Kibana's spaces and roles to ezMESURE's spaces
 */
const syncSpaces = async () => {
  const spaces = await SpacesService.findMany({});

  const executors = spaces.map(
    (space) => async () => {
      const spaceParams = {
        id: space.id,
        name: space.name,
        description: space.description || undefined,
        initials: space.initials || undefined,
        color: space.color || undefined,
      };

      const isSpaceExist = (await kibana.getSpace(space.id)).status !== 404;
      if (isSpaceExist) {
        await kibana.updateSpace(spaceParams);
      } else {
        await kibana.createSpace(spaceParams);
      }

      await kibana.putRole({
        name: generateRoleNameFromSpace(space, 'readonly'),
        body: {
          kibana: [
            {
              spaces: [space.id],
              base: ['read'],
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
              base: ['all'],
            },
          ],
        },
      });
    },
  );

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[kibana] Error on upserting spaces and spaces roles: ${error.message}`),
  );
  appLogger.verbose(`[kibana] Upserted ${res.fulfilled} spaces and ${res.fulfilled * 2} spaces roles (${res.errors} errors)`);
};

const sync = async () => {
  await syncSpaces();
};

/**
 * Start cron to periodically sync Kibana to ezMESURE
 */
const startCron = async () => {
  const job = new CronJob({
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
};
