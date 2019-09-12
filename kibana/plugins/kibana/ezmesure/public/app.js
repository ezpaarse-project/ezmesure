import React from 'react';
import { uiModules } from 'ui/modules';
import chrome from 'ui/chrome';
import { render, unmountComponentAtNode } from 'react-dom';
import $jQ from 'jquery';
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
  const currentUrl = $jQ(location).attr('pathname');
  let space = '';
  if (/^\/kibana\/s\/([a-z0-9\-]+)/i.test(currentUrl)) {
    space = currentUrl.split('/')[3];
  }

  // render react to DOM
  render(<Main title="Reporting" httpClient={$http} space={space} />, domNode);

  // unmount react on controller destroy
  $scope.$on('$destroy', () => {
    unmountComponentAtNode(domNode);
  });
}

chrome.setRootController('ezMesure', RootController);
