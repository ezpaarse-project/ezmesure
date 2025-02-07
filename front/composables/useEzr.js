import { prepareClient } from '@ezpaarse-project/ezreeport-vue';
import '@ezpaarse-project/ezreeport-vue/styles';
import { useFetch } from '#imports';

export default async function useEzr() {
  const {
    data: ezrProfile,
    error,
  } = await useFetch('/api/profile/reporting_token');

  if (!error.value) {
    prepareClient(
      '/report/api', // ezREEPORT API url
      { token: ezrProfile.value.token },
    );
  }

  return { error };
}
