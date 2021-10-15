import { schema } from '@kbn/config-schema';
import Address from '@hapi/address';
import { HttpAuth, Logger, IRouter } from '../../../../src/core/server';
import { PLUGIN_ID } from '../../common';
import { requestApi } from '../lib/api';

export function defineRoutes(router: IRouter, auth: HttpAuth, logger: Logger) {
  router.get(
    {
      path: '/api/ezreporting/tasks',
      validate: false,
      options: {
        authRequired: true,
        tags: [`access:${PLUGIN_ID}-read`],
      },
    },
    async function (context, req, res) {
      const { spaceId } = context.core?.savedObjects?.client;

      try {
        const tasks = await requestApi(auth.get(req), {
          url: `/tasks/${spaceId}`,
        });
        const frequencies = await requestApi(auth.get(req), {
          url: `/frequencies`,
        });
        const dashboards = await requestApi(auth.get(req), {
          url: `/dashboards/${spaceId}`,
        });

        return res.ok({
          body: {
            tasks: JSON.parse(tasks.body),
            frequencies: JSON.parse(frequencies.body),
            dashboards: JSON.parse(dashboards.body),
          },
        });
      } catch (error) {
        return res.customError({ statusCode: 500, body: error });
      }
    }
  );

  router.get(
    {
      path: '/api/ezreporting/tasks/management',
      validate: false,
      options: {
        authRequired: true,
        tags: [`access:${PLUGIN_ID}-read`],
      },
    },
    async function (context, req, res) {
      try {
        const tasks = await requestApi(auth.get(req), {
          url: `/tasks`,
        });
        const frequencies = await requestApi(auth.get(req), {
          url: `/frequencies`,
        });
        const dashboards = await requestApi(auth.get(req), {
          url: `/dashboards`,
        });
        const spaces = await requestApi(auth.get(req), {
          url: `/spaces`,
        });

        return res.ok({
          body: {
            tasks: JSON.parse(tasks.body),
            frequencies: JSON.parse(frequencies.body),
            dashboards: JSON.parse(dashboards.body),
            spaces: JSON.parse(spaces.body),
          },
        });
      } catch (error) {
        return res.customError({ statusCode: 500, body: error });
      }
    }
  );

  router.post(
    {
      path: '/api/ezreporting/tasks',
      validate: {
        body: schema.object({
          dashboardId: schema.string(),
          frequency: schema.string(),
          emails: schema.arrayOf(schema.string()),
          print: schema.boolean(),
          space: schema.maybe(schema.string()),
        }),
      },
      options: {
        authRequired: true,
        tags: [`access:${PLUGIN_ID}-all`],
        body: {
          accepts: ['application/json'],
        },
      },
    },
    async function (context, req, res) {
      const { spaceId } = context.core?.savedObjects?.client;
      try {
        let { body } = req;

        if (body.space.length === 0) {
          body.space = spaceId;
        }

        const result = await requestApi(auth.get(req), {
          method: 'POST',
          url: `/tasks`,
          body,
        });

        return res.ok({
          body: result.body,
        });
      } catch (error) {
        console.log(error);
        return res.customError({ statusCode: 500, body: error });
      }
    }
  );

  router.patch(
    {
      path: '/api/ezreporting/tasks/{taskId}',
      validate: {
        params: schema.object({
          taskId: schema.string(),
        }),
        body: schema.object({
          dashboardId: schema.string(),
          frequency: schema.string(),
          emails: schema.arrayOf(schema.string()),
          print: schema.boolean(),
          space: schema.maybe(schema.string()),
        }),
      },
      options: {
        authRequired: true,
        tags: [`access:${PLUGIN_ID}-all`],
        body: {
          accepts: ['application/json'],
        },
      },
    },
    async function (context, req, res) {
      const { spaceId } = context.core?.savedObjects?.client;
      const { taskId } = req.params;

      try {
        let body = req.body;

        const result = await requestApi(auth.get(req), {
          method: 'PATCH',
          url: `/tasks/${taskId}`,
          body: { ...body, space: spaceId },
        });

        return res.ok({
          body: result.body,
        });
      } catch (error) {
        return res.customError({ statusCode: 500, body: error });
      }
    }
  );

  router.delete(
    {
      path: '/api/ezreporting/tasks/{taskId}',
      validate: {
        params: schema.object({
          taskId: schema.string(),
        }),
      },
      options: {
        authRequired: true,
        tags: [`access:${PLUGIN_ID}-all`],
      },
    },
    async function (context, req, res) {
      const { taskId } = req.params;

      try {
        const result = await requestApi(auth.get(req), {
          method: 'DELETE',
          url: `/tasks/${taskId}`,
        });

        return res.ok({
          body: result.body,
        });
      } catch (error) {
        return res.customError({ statusCode: 500, body: error });
      }
    }
  );

  router.get(
    {
      path: '/api/ezreporting/tasks/{taskId}/download',
      validate: {
        params: schema.object({
          taskId: schema.string(),
        }),
      },
      options: {
        authRequired: true,
        tags: [`access:${PLUGIN_ID}-all`],
      },
    },
    async function (context, req, res) {
      const { taskId } = req.params;

      try {
        const result = await requestApi(auth.get(req), {
          url: `/tasks/${taskId}/download`,
        });

        return res.ok({
          body: result.body,
        });
      } catch (error) {
        return res.customError({ statusCode: 500, body: error });
      }
    }
  );

  router.get(
    {
      path: '/api/ezreporting/tasks/{taskId}/history',
      validate: {
        params: schema.object({
          taskId: schema.string(),
        }),
      },
      options: {
        authRequired: true,
        tags: [`access:${PLUGIN_ID}-all`],
      },
    },
    async function (context, req, res) {
      const { taskId } = req.params;

      try {
        const result = await requestApi(auth.get(req), {
          url: `/tasks/${taskId}/history`,
        });

        return res.ok({
          body: result.body,
        });
      } catch (error) {
        return res.customError({ statusCode: 500, body: error });
      }
    }
  );

  router.post(
    {
      path: '/api/ezreporting/email',
      validate: {
        body: schema.object({
          email: schema.string(),
        }),
      },
      options: {
        authRequired: true,
        tags: [`access:${PLUGIN_ID}-all`],
        body: {
          accepts: ['application/json'],
        },
      },
    },
    async function (context, req, res) {
      const { email } = req.body;

      if (!Address.email.isValid(email)) {
        return res.badRequest();
      }

      return res.ok();
    }
  );
}
