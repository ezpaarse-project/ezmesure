import axios from 'axios';
import jwt from 'jsonwebtoken';

export default function (server) {
  const config = server.config();

  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');

  const apiUrl = 'http://api:3000';

  const api = axios.create({
    baseURL: apiUrl,
    timeout: 5000,
    proxy: false,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InN0ZXZlbi53aWxtb3V0aCIsImVtYWlsIjoic3RldmVuLndpbG1vdXRoQGluaXN0LmZyIiwiaWF0IjoxNTY3MTY5MjU4fQ.5L1SLm8fCm1hGweyxL26ojN6nIG_F8s-DwTUMnLdOXU`,
    },
  });

  server.route({
    path: '/api/ezmesure/reporting/list/{space*}',
    method: 'GET',
    handler: async (req) => {
      server.log(['status', 'info', 'ezmesure:plugin'], 'Getting dashboards/reporting list');

      try {
        const resp = await callWithRequest(req, 'search', {
          index: '.ezmesure-metrics'
        }).then(res => console.log(res));


        const { data } = await api.get(`/reporting/list/${req.params.space || ''}`);
        return data;
      } catch (error) {
        server.log(['status', 'error', 'ezmesure:plugin'], error);
      }
      return null;
    },
  });

  server.route({
    path: '/api/ezmesure/reporting',
    method: 'PUT',
    handler: async req => {
      server.log(['status', 'info', 'ezmesure:plugin'], 'Updating reporting');
      // req.payload, req.auth
      // /^req.payload.space:dashboard:([0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12})$/i

      return req.payload;
    },
  });

  server.route({
    path: '/api/ezmesure/reporting/delete/{id}',
    method: 'DELETE',
    handler: async req => {
      server.log(['status', 'info', 'ezmesure:plugin'], 'Delete reporting');
      if (req.params && !req.params.id) {
        return 'error_no_id';
      }

      try {
        const { data } = await api.delete(`/reporting/delete/${req.params.id}`);
        console.log(data)
        return data;
      } catch (error) {
        server.log(['status', 'error', 'ezmesure:plugin'], error);
      }
      return null;
    },
  });
};