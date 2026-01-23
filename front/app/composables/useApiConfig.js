import {
  useFetch,
} from '#imports';

export default function useApiConfig() {
  return useFetch('/api/config', { lazy: true });
}
