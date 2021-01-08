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
import {
  EzreportingPluginSetup,
  EzreportingPluginStart,
  AppPluginStartDependencies,
} from './types';
import { HomePublicPluginSetup } from '../../../src/plugins/home/public';
import { ManagementSetup } from '../../../src/plugins/management/public';
import { FeatureCatalogueCategory } from '../../../src/plugins/home/public/services/feature_catalogue';
import { PLUGIN_NAME, PLUGIN_DESCRIPTION, PLUGIN_ID, PLUGIN_ICON, CATEGORY } from '../common';
import logo from './images/logo.png';

interface SetupDeps {
  home?: HomePublicPluginSetup;
  management: ManagementSetup;
}

interface ClientConfigType {
  applicationName: string;
}

export class EzreportingPlugin implements Plugin<EzreportingPluginSetup, EzreportingPluginStart> {
  initializerContext: PluginInitializerContext<ClientConfigType>;

  constructor(initializerContext: PluginInitializerContext<ClientConfigType>) {
    this.initializerContext = initializerContext;
  }

  public setup(core: CoreSetup, { home, management }: SetupDeps): EzreportingPluginSetup {
    const config = this.initializerContext.config.get<ClientConfigType>();
    const { applicationName } = config;

    CATEGORY.label = applicationName;

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
      euiIconType: PLUGIN_ICON,
      category: CATEGORY,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();

        coreStart.chrome.docTitle.change(`${PLUGIN_NAME} ${applicationName}`);

        const admin = false;

        const render = renderApp(
          coreStart,
          depsStart as AppPluginStartDependencies,
          params,
          applicationName,
          admin
        );

        // Render the application
        return () => {
          coreStart.chrome.docTitle.reset();
          render();
        };
      },
    });

    // Menagement section
    const managementSection = `${applicationName.toLowerCase()}_admin`;
    management.sections.register({
      id: managementSection,
      title: applicationName,
      order: 1000,
      icon: logo,
    });
    management.sections.getSection(managementSection)!.registerApp({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      order: 99,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();

        coreStart.chrome.docTitle.change(`${PLUGIN_NAME} ${applicationName}`);

        const admin = true;

        const render = renderApp(
          coreStart,
          depsStart as AppPluginStartDependencies,
          params,
          applicationName,
          admin
        );

        // Render the application
        return () => {
          coreStart.chrome.docTitle.reset();
          render();
        };
      },
    });

    // ezReporting app in home page
    home.featureCatalogue.register({
      id: PLUGIN_ID,
      title: `${PLUGIN_NAME} ${applicationName}`,
      icon: PLUGIN_ICON,
      description: PLUGIN_DESCRIPTION,
      path: `/app/${PLUGIN_ID}`,
      category: FeatureCatalogueCategory.OTHER,
      showOnHomePage: true,
    });

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): EzreportingPluginStart {
    return {};
  }

  public stop() {}
}
