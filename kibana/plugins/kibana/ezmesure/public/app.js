import { uiModules } from 'ui/modules';
import uiRoutes from 'ui/routes';
import $jQ from 'jquery';
import 'ui/autoload/all';

import reportingTemplate from './reporting/templates/index.html';

document.title = 'Reporting ezMESURE - Kibana';

uiRoutes.enable();

uiRoutes
  .when('/', {
    template: reportingTemplate,
    controller: 'ezMesureReportingController',
  });

uiModules
  .get('app/reporting')
  .controller('ezMesureReportingController', ['$scope', '$http', '$route', ($scope, $http, $route) => {
    const currentUrl = $jQ(location).attr('pathname');
    let space = '';
    if (/^\/kibana\/s\/([a-z0-9\-]+)/i.test(currentUrl)) {
      space = currentUrl.split('/')[3];
    }

    $scope.title = 'Reporting ezMESURE';

    $scope.loadData = () => {
      $http.get(`../api/ezmesure/reporting/list/${space}`).then((response) => {
        const { data, status } = response;
        $scope.status = status === 200;
        $scope.dashboardsList = data.dashboardsList;
        $scope.reportingList = data.reportingList;

        $scope.flyoutOpened = false;

        $scope.timesSpan = [
          'Hebdomadaire',
          'Bihebdomadaire',
          'Mensuelle',
          'Bimestrielle',
          'Trimestrielle',
          'Semestrielle',
          'Annuelle',
        ];

        $scope.reportingData = {
          dashboardId: null,
          timeSpan: null,
          emails: null,
        };

        $scope.saveReporting = () => {
          console.log($scope.reportingData);
        };
      });
    };

    $scope.loadData();
  }]);