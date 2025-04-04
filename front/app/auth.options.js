/**
 * @type {import('@nuxt/schema').NuxtConfig['auth']}
 */
export default {
  baseURL: '/api/',
  provider: {
    type: 'local',
    endpoints: {
      signIn: { path: '/login/local', method: 'post' },
      signOut: { path: '/logout', method: 'get' },
      signUp: false,
      getSession: { path: '/profile', method: 'get' },
    },
    token: {
      cookieName: 'eztoken',
    },
    session: {
      dataType: {
        username: 'string',
        fullName: 'string',
        email: 'string',
        createdAt: 'string',
        updatedAt: 'string',
        isAdmin: 'boolean',
        metadata: '{ acceptedTerms?: boolean }?',
      },
    },
    pages: {
      login: '/authenticate',
    },
  },
};
