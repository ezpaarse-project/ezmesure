import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EzReportingPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EzReportingPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
