import './index.scss';

import { EzReportingPlugin } from './plugin';
import { PluginInitializerContext } from '../../../src/core/public';

// This exports static code and TypeScript types,
// as well as, Kibana Platform `plugin()` initializer.
export function plugin(initializerContext: PluginInitializerContext) {
  return new EzReportingPlugin(initializerContext);
}
export { EzReportingPluginSetup, EzReportingPluginStart } from './types';
