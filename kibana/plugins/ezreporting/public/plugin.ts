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

import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import {
  EzreportingPluginSetup,
  EzreportingPluginStart,
  AppPluginStartDependencies,
} from './types';
import {
  PLUGIN_NAME,
  PLUGIN_DESCRIPTION,
  PLUGIN_ID,
  PLUGIN_ICON,
  EZMESURE_CATEGORY,
} from '../common';
import { HomePublicPluginSetup } from '../../../src/plugins/home/public';
import {
  FeatureCatalogueRegistry,
  FeatureCatalogueCategory,
} from '../../../src/plugins/home/public/services/feature_catalogue';

interface SetupDeps {
  home?: HomePublicPluginSetup;
}

export class EzreportingPlugin implements Plugin<EzreportingPluginSetup, EzreportingPluginStart> {
  public setup(core: CoreSetup, { home }: SetupDeps): EzreportingPluginSetup {
    const ezmesureLink = process.env.APPLI_APACHE_SERVERNAME;

    core.application.register({
      id: 'ezmesure',
      title: 'Back to ezMESURE',
      euiIconType: 'editorUndo',
      category: EZMESURE_CATEGORY,
      mount() {
        return (window.location.href = 'https://ezmesure.couperin.org');
      },
    });

    core.application.register({
      id: PLUGIN_ID,
      title: process.env.REPORTING_NAME || PLUGIN_NAME,
      euiIconType: PLUGIN_ICON,
      category: EZMESURE_CATEGORY,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();

        coreStart.chrome.docTitle.change(process.env.REPORTING_NAME || PLUGIN_NAME);

        const render = renderApp(coreStart, depsStart as AppPluginStartDependencies, params);

        // Render the application
        return () => {
          coreStart.chrome.docTitle.reset();
          render();
        };
      },
    });

    home.featureCatalogue.register({
      id: PLUGIN_ID,
      title: process.env.REPORTING_NAME || PLUGIN_NAME,
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
