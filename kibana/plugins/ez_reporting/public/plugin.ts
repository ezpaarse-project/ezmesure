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
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/public';
import { EzReportingPluginSetup, EzReportingPluginStart } from './types';
import { HomePublicPluginSetup, FeatureCatalogueCategory } from '../../../src/plugins/home/public';
import { ManagementSetup } from '../../../src/plugins/management/public';
import {
  PLUGIN_NAME,
  PLUGIN_DESCRIPTION,
  PLUGIN_APP_NAME,
  PLUGIN_ID,
  PLUGIN_ICON,
  CATEGORY,
} from '../common';
import logo from './images/logo.png';

interface SetupDeps {
  management: ManagementSetup;
  home?: HomePublicPluginSetup;
}

interface ClientConfigType {
  applicationName: string;
}

export class EzReportingPlugin implements Plugin<EzReportingPluginSetup, EzReportingPluginStart> {
  initializerContext: PluginInitializerContext<ClientConfigType>;

  constructor(initializerContext: PluginInitializerContext<ClientConfigType>) {
    this.initializerContext = initializerContext;
  }

  public setup(core: CoreSetup, { home, management }: SetupDeps): EzReportingPluginSetup {
    const config = this.initializerContext.config.get<ClientConfigType>();
    const { applicationName } = config;

    CATEGORY.label = applicationName;
    CATEGORY.euiIconType = logo;

    const { protocol, hostname, port } = window.location;
    const ezmesureLink = `${protocol}//${hostname}${port ? `:${port}` : ''}/`;

    // Back to PLUGIN_NAME link
    core.application.register({
      id: `${applicationName.toLocaleLowerCase()}_back`,
      title: `Back to ${applicationName}`,
      euiIconType: 'editorUndo',
      category: CATEGORY,
      mount: () => (window.location.href = ezmesureLink),
    });

    // ezReporting app
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      icon: PLUGIN_ICON,
      category: CATEGORY,
      mount: async (params: AppMountParameters) => {
        // Load application bundle
        const { mountApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();
        const { chrome } = coreStart;

        chrome.docTitle.change(`${PLUGIN_NAME} ${applicationName}`);
        chrome.setBreadcrumbs([{ text: `${PLUGIN_NAME} ${applicationName}` }]);

        const admin = false;

        const unmountAppCallback = await mountApp({
          coreStart,
          depsStart,
          params,
          applicationName,
          admin,
        });

        // Render the application
        return () => {
          chrome.docTitle.reset();
          unmountAppCallback();
        };
      },
    });

    // Menagement section
    const managementSection = `${applicationName.toLowerCase()}_admin`;
    const appManagementSection = management.sections.register({
      id: managementSection,
      title: applicationName,
      order: 1000,
      icon: logo,
    });
    appManagementSection.registerApp({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      order: 99,
      mount: async (params: AppMountParameters) => {
        // Load application bundle
        const { mountApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();
        const { chrome } = coreStart;

        chrome.docTitle.change(`${PLUGIN_NAME} ${applicationName}`);
        chrome.setBreadcrumbs([
          {
            text: 'Stack Management',
            href: coreStart.http.basePath.prepend('/app/management'),
          },
          { text: PLUGIN_APP_NAME },
          { text: PLUGIN_NAME },
        ]);

        const admin = true;

        const unmountAppCallback = await mountApp({
          coreStart,
          depsStart,
          params,
          applicationName,
          admin,
        });

        // Render the application
        return () => {
          chrome.docTitle.reset();
          unmountAppCallback();
        };
      },
    });

    // ezReporting app in home page
    if (home) {
      // home.featureCatalogue.registerSolution({
      //   id: PLUGIN_ID,
      //   title: `${PLUGIN_NAME} ${applicationName}`,
      //   subtitle: `${PLUGIN_NAME} ${applicationName}`,
      //   description: PLUGIN_DESCRIPTION,
      //   icon: PLUGIN_ICON,
      //   path: `/app/${PLUGIN_ID}`,
      //   appDescriptions: [`${PLUGIN_NAME} ${applicationName}`, PLUGIN_DESCRIPTION],
      // });

      home.featureCatalogue.register({
        id: PLUGIN_ID,
        title: `${PLUGIN_NAME} ${applicationName}`,
        subtitle: `${PLUGIN_NAME} ${applicationName}`,
        description: PLUGIN_DESCRIPTION,
        icon: PLUGIN_ICON,
        path: `/app/${PLUGIN_ID}`,
        showOnHomePage: true,
        category: FeatureCatalogueCategory.OTHER,
        solutionId: `${PLUGIN_NAME} ${applicationName}`,
      });

      home.featureCatalogue.register({
        id: `${PLUGIN_ID}_management`,
        title: `Management - ${PLUGIN_NAME} ${applicationName}`,
        subtitle: `Management - ${PLUGIN_NAME} ${applicationName}`,
        description: PLUGIN_DESCRIPTION,
        icon: PLUGIN_ICON,
        path: `/app/management/ezmesure/${PLUGIN_ID}`,
        showOnHomePage: true,
        category: FeatureCatalogueCategory.ADMIN,
        solutionId: `${PLUGIN_NAME} ${applicationName}`,
        order: 1,
      });
    }

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): EzReportingPluginStart {
    return {};
  }

  public stop() {}
}
