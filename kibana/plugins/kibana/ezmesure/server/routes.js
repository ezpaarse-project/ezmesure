export default function (server) {
  server.route({
    path: '/api/ezmesure/dashboards',
    method: 'GET',
    handler: () => {
      server.log(['status', 'info', 'ezmesure:plugin'], 'Getting dashboards');
      return [
        {
          name: 'Dashboard : a',
          reporting: false,
          time: '',
        },
        {
          name: 'Dashboard : b',
          reporting: true,
          time: 'Hebdomadaire',
        },
        {
          name: 'Dashboard : c',
          reporting: true,
          time: 'Bihebdomadaire',
        },
        {
          name: 'Dashboard : d',
          reporting: true,
          time: 'Mensuelle',
        },
        {
          name: 'Dashboard : e',
          reporting: true,
          time: 'Bimestrielle',
        },
        {
          name: 'Dashboard : f',
          reporting: true,
          time: 'Trimestrielle',
        },
        {
          name: 'Dashboard : g',
          reporting: true,
          time: 'Semestrielle',
        },
        {
          name: 'Dashboard : h',
          reporting: true,
          time: 'Annuelle',
        },
      ];
    },
  });

  server.route({
    path: '/api/ezmesure/reporting',
    method: 'POST',
    handler: (req) => {
      server.log(['status', 'info', 'ezmesure:plugin'], 'Updating reporting');
      return req.auth;
    },
  });
};