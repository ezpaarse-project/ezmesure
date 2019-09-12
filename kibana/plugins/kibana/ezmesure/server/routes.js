export default function (server) {
  const apiUrl = 'http://api:3000';

  server.route({
    path: '/api/ezmesure/{path*}',
    method: ['GET', 'POST', 'PATCH', 'DELETE'],
    handler: {
      proxy: {
        mapUri: request => {
          return { uri: `${apiUrl}/${request.params.path || ''}` };
        }
      }
    }
  });
};