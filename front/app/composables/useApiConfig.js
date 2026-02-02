import {
  useFetch,
  useNuxtApp,
} from '#imports';

export default function useApiConfig() {
  const nuxtApp = useNuxtApp();

  return useFetch('/api/config', {
    getCachedData(key) {
      return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
    },
  });
}
