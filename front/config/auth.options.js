/**
 * @type {import('@nuxt/schema').NuxtConfig['auth']}
 */
export default {
  baseURL: '/api/',
  provider: {
    type: 'local',
    endpoints: {
      signIn: false,
      signOut: false,
      signUp: false,
      getSession: { path: '/auth', method: 'get' },
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
        excludeNotifications: 'string[]',
        metadata: '{ acceptedTerms?: boolean }?',
      },
    },
    pages: {
      login: '/authenticate',
    },
  },
};
