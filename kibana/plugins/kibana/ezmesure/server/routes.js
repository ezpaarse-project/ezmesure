import axios from 'axios';
import Boom from 'boom';

export default function (server) {
  const config = server.config();

  const api = axios.create({
    auth: {
      username: 'elastic',
      password: 'ezTEAM#54514',
    },
    timeout: 5000,
    headers: { 'kbn-xsrf': 'true' },
    proxy: false,
  });

  server.route({
    path: '/api/ezmesure/reporting/list/{space*}',
    method: 'GET',
    handler: async (req) => {
      server.log(['status', 'info', 'ezmesure:plugin'], 'Getting reporting list');

      const kibanaUrl = 'http://localhost:5601';
      const url = (req.params.space) ? `${kibanaUrl}/s/${req.params.space}/api/saved_objects/_find` : `${kibanaUrl}/api/saved_objects/_find`;
      const { data } = await api.get(url, {
        params: {
          type: 'dashboard',
          per_page: 10000,
        },
      });

      const savedObjects = data.saved_objects;
      if (!savedObjects) {
        server.log(['status', 'error', 'ezmesure:plugin'], 'Dashboards not founds');
        return { error: 'dashboards_not_found' };
      }

      const reportingList = [
        {
          id: '9d418e90-ba75-11e9-973d-e33aa776d300',
          name: 'Dashboard : a',
          time: 'Hebdomadaire',
        },
      ];

      const dashboardsList = [];
      savedObjects.forEach(savedObject => {
        dashboardsList.push({
          id: savedObject.id,
          name: savedObject.attributes.title,
        });
      });
      return { dashboardsList, reportingList };
    },
  });

  server.route({
    path: '/api/ezmesure/reporting',
    method: 'PUT',
    handler: (req) => {
      server.log(['status', 'info', 'ezmesure:plugin'], 'Updating reporting');
      // req.payload, req.auth
      // /^req.payload.space:dashboard:([0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12})$/i

      return req.payload;
    },
  });
};