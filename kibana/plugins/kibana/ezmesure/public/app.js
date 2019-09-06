import React from 'react';
import { uiModules } from 'ui/modules';
import chrome from 'ui/chrome';
import { render, unmountComponentAtNode } from 'react-dom';
import { I18nProvider } from '@kbn/i18n/react';

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

app.config(stateManagementConfigProvider => stateManagementConfigProvider.disable());

function RootController($scope, $element, $http) {
  const domNode = $element[0];

  render(
    <I18nProvider>
      <Main title="ezMESURE Reporting" httpClient={$http} />
    </I18nProvider>,
    domNode
  );

  $scope.$on('$destroy', () => {
    unmountComponentAtNode(domNode);
  });
}

chrome.setRootController('ezMesure', RootController);