import {
  defineStore,
  navigateTo,
  ref,
  computed,
  watch,
  useEventBus,
  useDialogStore,
} from '#imports';

import AuthExpiredDialog from '../components/skeleton/AuthExpiredDialog.vue';

/**
 * @typedef {object} AuthenticatedUser
 * @property {string} username
 * @property {string} fullName
 * @property {string} email
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {boolean} isAdmin
 * @property {string[]} excludeNotifications
 * @property {boolean} acceptedTerms
 * @property {{}} metadata
 */

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

export const useAuthStore = defineStore('auth', () => {
  const { openDialog } = useDialogStore();

  let timeoutId;
  /** @type {Ref<AuthenticatedUser | null>} */
  const user = ref(null);

  const openExpiredSessionConfirm = () => openDialog({ component: AuthExpiredDialog });

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
   * Refresh status of user
   */
  async function refreshAuthenticatedUser(options = {}) {
    try {
      user.value = await $fetch('/api/auth');
    } catch {
      user.value = null;
      if (options.confirmOnError !== false) {
        await openExpiredSessionConfirm();
      }
    }
  }

  /**
   * Setup auth token rotation
   */
  async function setupTokenRotation() {
    try {
      const info = await $fetch('/api/auth/oauth/refresh', { method: 'POST' });
      if (info.refresh_token && info.expires_in > 0) {
        timeoutId = setTimeout(() => setupTokenRotation(), info.expires_in * 1000);
      }
    } catch {
      user.value = null;
      if (timeoutId) {
        await openExpiredSessionConfirm();
        timeoutId = undefined;
      }
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
    if (previous.username !== value.username) {
      bus.emit('logout', previous);
      bus.emit('login', value);
    }
  });

  bus.on((event) => {
    // Start token rotation on login
    if (event === 'login') {
      setupTokenRotation();
    }
    // Stop token rotation on logout
    if (event === 'logout') {
      clearTimeout(timeoutId);
    }
  });

  return {
    isAuthenticated: computed(() => !!user.value),
    user: computed(() => user.value),

    signIn,
    signOut,
    refreshAuthenticatedUser,

    bus,
  };
});
