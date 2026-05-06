import {
  navigateTo,
  ref,
  computed,
  watch,
  useEventBus,
} from '#imports';

/**
 * @typedef {object} AuthenticatedUser
 * @property {string} username
 * @property {string} fullName
 * @property {string} email
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {boolean} isAdmin
 * @property {string[]} excludeNotifications
 * @property {{ acceptedTerms?: boolean }?} metadata
 */

/** @type {Ref<AuthenticatedUser | null>} */
const user = ref(null);

/**
 * Start sign in of user
 *
 * @param {string} [origin] - The origin from where you're signin
 */
async function signIn(origin) {
  await navigateTo(
    { path: '/api/auth/oauth/login', query: { origin } },
    { external: true },
  );
}

/**
 * Start sign out of user
 *
 * @param {{ local?: boolean }} [options] - Options to sign out
 */
async function signOut(options = {}) {
  if (options.local) {
    user.value = null;
    return;
  }

  await navigateTo({ path: '/api/auth/oauth/logout' }, { external: true });
}

/**
 * Refresh status of user, will redirect to login form if error is thrown
 */
async function refreshAuthenticatedUser() {
  try {
    user.value = await $fetch('/api/auth');
  } catch {
    user.value = null;
    await navigateTo('/authenticate');
  }
}

let timeoutId;
/**
 * Setup auth token rotation, will redirect to login form if error is thrown
 */
async function setupTokenRotation() {
  try {
    const info = await $fetch('/api/auth/oauth/refresh', { method: 'POST' });
    if (info.refresh_token) {
      timeoutId = setTimeout(() => setupTokenRotation(), info.expires_in * 1000);
    }
  } catch {
    user.value = null;
    await navigateTo('/authenticate');
  }
}

// Setup events
const bus = useEventBus('auth');
watch(user, (value, previous) => {
  if (!previous && value) {
    bus.emit('login', value);
    return;
  }
  if (previous && !value) {
    bus.emit('logout', previous);
    return;
  }
  if (previous.username && value.username) {
    bus.emit('logout', previous);
    bus.emit('login', value);
  }
});

bus.on((event) => {
  // Start token rotation on login
  if (event === 'login') {
    setupTokenRotation();
  }
  // Stop refresh on logout
  if (event === 'logout') {
    clearTimeout(timeoutId);
  }
});

/**
 * Composable to get current auth status
 */
export default function useAuth() {
  return {
    isAuthenticated: computed(() => !!user.value),
    user: computed(() => user.value),

    signIn,
    signOut,
    refreshAuthenticatedUser,

    bus,
  };
}
