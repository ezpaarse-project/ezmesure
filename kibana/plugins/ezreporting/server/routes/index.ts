/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { schema } from '@kbn/config-schema';
import Address from '@hapi/address';
import { IRouter } from '../../../../src/core/server';
import { PLUGIN_ID } from '../../common';
import { requestApi } from '../lib/api';

export function defineRoutes(router: IRouter, auth: object) {
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
      const { username } = auth.get(req).state;

      try {
        const result = await requestApi({
          url: `/reporting/tasks/${spaceId === 'default' ? '' : spaceId}?user=${username}`,
        });

        return res.ok({
          body: JSON.parse(result.body),
        });
      } catch (error) {
        return res.internalError({
          body: error,
        });
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
      const { username } = auth.get(req).state;

      try {
        let body = req.body;

        if (spaceId !== 'default') {
          body = { ...body, spaceId };
        }

        const result = await requestApi({
          method: 'POST',
          url: `/reporting/tasks?user=${username}`,
          body,
        });

        return res.ok({
          body: result.body,
        });
      } catch (error) {
        return res.internalError({
          body: error,
        });
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
      const { username } = auth.get(req).state;
      const { taskId } = req.params;

      try {
        let body = req.body;

        if (spaceId !== 'default') {
          body = { ...body, spaceId };
        }

        const result = await requestApi({
          method: 'PATCH',
          url: `/reporting/tasks/${taskId}?user=${username}`,
          body,
        });

        return res.ok();
      } catch (error) {
        return res.internalError({
          body: error,
        });
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
        body: {
          accepts: ['application/json'],
        },
      },
    },
    async function (context, req, res) {
      const { username } = auth.get(req).state;
      const { taskId } = req.params;

      try {
        const result = await requestApi({
          method: 'DELETE',
          url: `/reporting/tasks/${taskId}?user=${username}`,
        });

        return res.ok({
          body: result.body,
        });
      } catch (error) {
        return res.internalError({
          body: error,
        });
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
        tags: [`access:${PLUGIN_ID}-read`, `access:${PLUGIN_ID}-all`],
      },
    },
    async function (context, req, res) {
      const { username } = auth.get(req).state;
      const { taskId } = req.params;

      try {
        const result = await requestApi({
          url: `/reporting/tasks/${taskId}/history?user=${username}`,
        });

        return res.ok({
          body: JSON.parse(result.body),
        });
      } catch (error) {
        return res.internalError({
          body: error,
        });
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
        tags: [`access:${PLUGIN_ID}-read`, `access:${PLUGIN_ID}-all`],
      },
    },
    async function (context, req, res) {
      const { username } = auth.get(req).state;
      const { taskId } = req.params;

      try {
        const result = await requestApi({
          url: `/reporting/tasks/${taskId}/download?user=${username}`,
        });

        return res.ok();
      } catch (error) {
        return res.internalError({
          body: error,
        });
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
