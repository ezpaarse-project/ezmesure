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
  private initializerContext: PluginInitializerContext<ClientConfigType>;

  constructor(initializerContext: PluginInitializerContext<ClientConfigType>) {
    this.initializerContext = initializerContext;
  }

  public setup(core: CoreSetup, { home, management }: SetupDeps): EzReportingPluginSetup {
    const config: ClientConfigType = this.initializerContext.config.get<ClientConfigType>();
    const applicationName: string = config.applicationName;

    CATEGORY.label = applicationName;
    CATEGORY.euiIconType = logo;

    const { protocol, hostname, port }: Location = window.location;
    const ezmesureLink: string = `${protocol}//${hostname}${port ? `:${port}` : ''}/`;

    // Back to PLUGIN_NAME link
    core.application.register({
      id: `${PLUGIN_ID}_back`,
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

        const admin: boolean = false;

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
    if (management) {
      const managementSection: string = `${applicationName.toLowerCase()}`;
      console.log(managementSection);
      const appManagementSection = management.sections.register({
        id: managementSection,
        title: applicationName,
        tip: PLUGIN_DESCRIPTION.replace('%APP_NAME%', applicationName),
        order: 1000,
      });
      appManagementSection.registerApp({
        id: `${PLUGIN_ID}_management`,
        title: PLUGIN_NAME,
        order: 99,
        mount: async (params: AppMountParameters) => {
          // Load application bundle
          const { mountApp } = await import('./application');
          // Get start services as specified in kibana.json
          const [coreStart, depsStart] = await core.getStartServices();
          const { chrome } = coreStart;

          chrome.docTitle.change(`Management - ${PLUGIN_NAME} ${applicationName}`);
          chrome.setBreadcrumbs([
            {
              text: 'Stack Management',
              href: coreStart.http.basePath.prepend('/app/management'),
            },
            { text: PLUGIN_APP_NAME },
            { text: PLUGIN_NAME },
          ]);

          const admin: boolean = true;

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

      if (home) {
        home.featureCatalogue.register({
          id: `${PLUGIN_ID}_management`,
          title: `Management - ${PLUGIN_NAME} ${applicationName}`,
          subtitle: `Management - ${PLUGIN_NAME} ${applicationName}`,
          description: PLUGIN_DESCRIPTION.replace('%APP_NAME%', applicationName),
          icon: PLUGIN_ICON,
          path: `/app/management/${managementSection}/${PLUGIN_ID}`,
          showOnHomePage: true,
          category: FeatureCatalogueCategory.ADMIN,
          solutionId: `${PLUGIN_NAME} ${applicationName}`,
          order: 1,
        });
      }
    }

    // ezReporting app in home page
    if (home) {
      home.featureCatalogue.registerSolution({
        id: PLUGIN_ID,
        title: `${PLUGIN_NAME} ${applicationName}`,
        subtitle: `${PLUGIN_NAME} ${applicationName}`,
        description: PLUGIN_DESCRIPTION.replace('%APP_NAME%', applicationName),
        icon: PLUGIN_ICON,
        path: `/app/${PLUGIN_ID}`,
        appDescriptions: [`${PLUGIN_NAME} ${applicationName}`, PLUGIN_DESCRIPTION.replace('%APP_NAME%', applicationName)],
      });

      home.featureCatalogue.register({
        id: PLUGIN_ID,
        title: `${PLUGIN_NAME} ${applicationName}`,
        subtitle: `${PLUGIN_NAME} ${applicationName}`,
        description: PLUGIN_DESCRIPTION.replace('%APP_NAME%', applicationName),
        icon: PLUGIN_ICON,
        path: `/app/${PLUGIN_ID}`,
        showOnHomePage: true,
        category: FeatureCatalogueCategory.OTHER,
        solutionId: `${PLUGIN_NAME} ${applicationName}`,
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
