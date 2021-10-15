import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { EzReportingPluginSetup, EzReportingPluginStart } from './types';
import { defineRoutes } from './routes';
import { PluginSetupContract as FeaturesPluginSetup } from '../../../x-pack/plugins/features/server';

import { PLUGIN_NAME, PLUGIN_ID, PLUGIN_ICON, PLUGIN_APP_NAME, PLUGIN_DESCRIPTION } from '../common';

export interface EzReportingDeps {
  features: FeaturesPluginSetup;
}

interface ServerConfigType {
  applicationName: string;
}

export enum AlertType {
  ErrorCount = 'ezreporting.error_rate', // ErrorRate was renamed to ErrorCount but the key is kept as `error_rate` for backwards-compat.
  TransactionErrorRate = 'ezreporting.transaction_error_rate',
  TransactionDuration = 'ezreporting.transaction_duration',
  TransactionDurationAnomaly = 'ezreporting.transaction_duration_anomaly',
}

export class EzreportingPlugin
  implements Plugin<EzReportingPluginSetup, EzReportingPluginStart, EzReportingDeps> {
  private readonly logger: Logger;

  initializerContext: PluginInitializerContext<ServerConfigType>;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.initializerContext = initializerContext;
  }

  public async setup(core: CoreSetup, { features }: EzReportingDeps) {
    this.logger.debug(`${PLUGIN_ID}: Setup`);

    const router = core.http.createRouter();

    const cookieOptions = {
      name: 'sid',
      encryptionKey: 'something_at_least_32_characters',
      validate: () => ({ isValid: true }),
      isSecure: false,
    };

    // Register server side APIs
    const { auth } = core.http;
    defineRoutes(router, auth, this.logger);

    const applicationName = process.env.EZMESURE_APPLICATION_NAME || PLUGIN_APP_NAME;

    const featuresCategory = {
      id: `${applicationName.toLowerCase()}`,
      label: `${PLUGIN_NAME} ${applicationName}`,
      ariaLabel:`${PLUGIN_NAME} ${applicationName}`,
      order: 1000,
      euiIconType: 'reportingApp',
    };

    features.registerKibanaFeature({
      id: PLUGIN_ID,
      name: `${PLUGIN_NAME} ${PLUGIN_APP_NAME}`,
      category: featuresCategory,
      app: [PLUGIN_ID, 'kibana'],
      catalogue: [PLUGIN_ID],
      privilegesTooltip: PLUGIN_DESCRIPTION,
      privileges: {
        all: {
          app: [PLUGIN_ID, 'kibana'],
          api: [`${PLUGIN_ID}-read`, `${PLUGIN_ID}-all`],
          catalogue: [PLUGIN_ID],
          savedObject: {
            all: [],
            read: [],
          },
          ui: ['create', 'edit', 'save', 'download', 'delete', 'show'],
        },
        read: {
          app: [PLUGIN_ID, 'kibana'],
          api: [`${PLUGIN_ID}-read`],
          catalogue: [PLUGIN_ID],
          savedObject: {
            all: [],
            read: [],
          },
          ui: ['view'],
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
