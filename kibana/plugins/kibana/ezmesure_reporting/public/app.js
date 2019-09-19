/* eslint-disable @kbn/eslint/require-license-header */
import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { uiModules } from 'ui/modules';
// eslint-disable-next-line import/no-unresolved
import chrome from 'ui/chrome';
import { render, unmountComponentAtNode } from 'react-dom';
import { I18nProvider } from '@kbn/i18n/react';
import $jQ from 'jquery';
// eslint-disable-next-line import/no-unresolved
import 'ui/autoload/styles';
import { Main } from './components/main';

const app = uiModules.get('apps/ezmesure');

app.config($locationProvider => {
  $locationProvider.html5Mode({
    enabled: false,
    requireBase: false,
    rewriteLinks: false
  });
});
app.config(stateManagementConfigProvider =>
  stateManagementConfigProvider.disable()
);

function RootController($scope, $element, $http) {
  const domNode = $element[0];

  // get space name
  // eslint-disable-next-line no-restricted-globals
  const currentUrl = $jQ(location).attr('pathname');
  let space = '';
  if (/^\/kibana\/s\/([a-z0-9\-]+)/i.test(currentUrl)) {
    space = currentUrl.split('/')[3];
  }

  // render react to DOM
  render(
    <I18nProvider>
      <Main title="ezmesureReporting" httpClient={$http} space={space} />
    </I18nProvider>,
    domNode
  );

  // unmount react on controller destroy
  $scope.$on('$destroy', () => {
    unmountComponentAtNode(domNode);
  });
}

chrome.setRootController('ezmesureReporting', RootController);
