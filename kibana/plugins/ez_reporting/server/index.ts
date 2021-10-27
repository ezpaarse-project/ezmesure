import { schema, TypeOf } from '@kbn/config-schema';
import { PluginInitializerContext, PluginConfigDescriptor } from '../../../src/core/server';
import { EzreportingPlugin } from './plugin';
import { PLUGIN_APP_NAME } from '../common';

const configSchema = schema.object({
  applicationName: schema.string({
    defaultValue: process.env.EZMESURE_APPLICATION_NAME || PLUGIN_APP_NAME,
  }),
});

type ConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<ConfigType> = {
  exposeToBrowser: {
    applicationName: true,
  },
  schema: configSchema,
};

//  This exports static code and TypeScript types,
//  as well as, Kibana Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new EzreportingPlugin(initializerContext);
}

export { EzreportingPluginSetup, EzreportingPluginStart } from './types';
