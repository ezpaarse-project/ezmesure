import axios from "axios";

export default defineNuxtPlugin((nuxtApp) => {
  const APIhost = nuxtApp.$config.public.APIHost;

  const api = axios.create({
    baseURL: APIhost,
  });

  return {
    provide: {
      api,
    },
  };
});