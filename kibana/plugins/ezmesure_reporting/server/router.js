export default function (server, apiUrl) {
  server.route({
    path: '/api/ezmesure/{path*}',
    method: ['GET', 'POST', 'PATCH', 'DELETE'],
    config: {
      tags: ['access:ezmesure_reporting'],
      handler: {
        proxy: {
          mapUri: request => {
            if (!request) return;
            if (!request.auth) return;
            if (!request.auth.credentials) return;

            return { uri: `${apiUrl}/${request.params.path || ''}?user=${request.auth.credentials.username}` };
          },
        },
      },
    },
  });
}
