export default function (server, apiUrl) {
  server.route({
    path: '/api/ezmesure/{path*}',
    method: ['GET', 'POST', 'PATCH', 'DELETE'],
    config: {
      tags: ['access:ezmesure_reporting'],
      handler: {
        proxy: {
          mapUri: request => {
            return { uri: `${apiUrl}/${request.params.path || ''}` };
          },
        },
      },
    },
  });
}
