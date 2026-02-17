import { useFetch } from '#imports';

export default function useApiConfig() {
  return useFetch('/api/config', {
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  });
}
