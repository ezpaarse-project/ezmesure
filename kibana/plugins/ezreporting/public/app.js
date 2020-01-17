import React from 'react';
import { uiModules } from 'ui/modules';
import chrome from 'ui/chrome';
import { render, unmountComponentAtNode } from 'react-dom';
import { I18nProvider } from '@kbn/i18n/react';
import $jQ from 'jquery';
import 'ui/autoload/styles';
import { Main } from './components/main';

const app = uiModules.get('apps/ezreporting');

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
  const currentUrl = $jQ(window.location).attr('pathname');
  const match = /^\/kibana\/s\/([a-z0-9\-]+)/i.exec(currentUrl);
  const space = match ? match[1] : '';

  // render react to DOM
  render(
    <I18nProvider>
      <Main title="ezReporting" httpClient={$http} space={space} />
    </I18nProvider>,
    domNode
  );

  // unmount react on controller destroy
  $scope.$on('$destroy', () => {
    unmountComponentAtNode(domNode);
  });
}

chrome.setRootController('ezReporting', RootController);
