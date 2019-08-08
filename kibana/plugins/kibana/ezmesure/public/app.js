import elasticsearch from 'elasticsearch';
import { uiModules } from 'ui/modules';
import uiRoutes from 'ui/routes';
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
    $scope.title = 'Reporting ezMESURE';

    $scope.loadData = () => {
      $http.get('../api/ezmesure/dashboards').then((response) => {
        const { data: dashboards, status } = response;
        $scope.status = status === 200;
        $scope.dashboards = dashboards;

        $scope.times = [
          'Hebdomadaire',
          'Bihebdomadaire',
          'Mensuelle',
          'Bimestrielle',
          'Trimestrielle',
          'Semestrielle',
          'Annuelle',
        ];
        $scope.errorTime = false;

        $scope.updateReporting = (dashboard) => {
          if (dashboard) {
            if (!dashboard.time || dashboard.time.length <= 0) {
              $scope.errorTime = true;
              dashboard.reporting = false;
            }
            if (dashboard.time || dashboard.time.length > 0) {
              $scope.errorTime = false;

              $http.post('../api/ezmesure/reporting', dashboard).then((response) => {
                console.log(response.data)
              });
            }
          }
        };
      });
    };

    $scope.loadData();
  }]);