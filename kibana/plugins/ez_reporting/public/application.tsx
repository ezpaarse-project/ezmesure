import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart, UnmountCallback } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { EzReportingApp } from './components/app';

import {
  httpClient,
  setHttpClient,
  toasts,
  setToasts,
  capabilities,
  setCapabilities,
} from '../lib/reporting';

const renderApp = (
  { application, notifications, http }: CoreStart,
  { navigation }: AppPluginStartDependencies,
  { element }: AppMountParameters,
  applicationName: string,
  admin: boolean
): UnmountCallback => {
  if (!httpClient) {
    setHttpClient(http);
  }
  if (!toasts) {
    setToasts(notifications.toasts);
  }
  if (!capabilities) {
    setCapabilities(application.capabilities);
  }

  ReactDOM.render(
    <EzReportingApp
      basename={http.basePath.get()}
      navigation={navigation}
      applicationName={applicationName}
      admin={admin}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};

export async function mountApp({
  coreStart,
  depsStart,
  params,
  applicationName,
  admin,
}: {
  coreStart: CoreStart,
  depsStart: AppPluginStartDependencies,
  params: AppMountParameters,
  applicationName: string,
  admin: boolean,
}): Promise<UnmountCallback> {
  return renderApp(coreStart, depsStart, params, applicationName, admin);
}
