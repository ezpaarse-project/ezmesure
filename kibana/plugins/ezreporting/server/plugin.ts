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

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { EzreportingPluginSetup, EzreportingPluginStart } from './types';
import { defineRoutes } from './routes';
import { PluginSetupContract as FeaturesPluginSetup } from '../../../x-pack/plugins/features/server';

import { PLUGIN_NAME, PLUGIN_ID, PLUGIN_ICON, PLUGIN_APP_NAME } from '../common';

export interface EzReportingDeps {
  features: FeaturesPluginSetup;
}

export class EzreportingPlugin
  implements Plugin<EzreportingPluginSetup, EzreportingPluginStart, EzReportingDeps> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup, { features }: EzReportingDeps) {
    this.logger.debug(`${PLUGIN_ID}: Setup`);

    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router, core.http.auth);

    features.registerFeature({
      id: PLUGIN_ID,
      name: `${PLUGIN_NAME} ${PLUGIN_APP_NAME}`,
      icon: PLUGIN_ICON,
      app: [PLUGIN_ID, 'kibana'],
      catalogue: [PLUGIN_ID],
      navLinkId: PLUGIN_ID,
      privileges: {
        all: {
          app: [PLUGIN_ID, 'kibana'],
          api: [`${PLUGIN_ID}-read`, `${PLUGIN_ID}-all`],
          catalogue: [PLUGIN_ID],
          savedObject: {
            all: [],
            read: [],
          },
          ui: ['create', 'edit', 'save', 'delete', 'show'],
        },
        read: {
          app: [PLUGIN_ID, 'kibana'],
          api: [`${PLUGIN_ID}-read`],
          catalogue: [PLUGIN_ID],
          savedObject: {
            all: [],
            read: [],
          },
          ui: [],
        },
      },
    });

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug(`${PLUGIN_ID}: Started`);
    return {};
  }

  public stop() {
    this.logger.debug(`${PLUGIN_ID}: Stopped`);
    return {};
  }
}
