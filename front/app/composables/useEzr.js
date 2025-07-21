import { prepareClient } from '@ezpaarse-project/ezreeport-vue';
import '@ezpaarse-project/ezreeport-vue/styles';
import {
  useFetch,
  useLocalStorage,
  ref,
  computed,
} from '#imports';

export default async function useEzr() {
  const {
    data: ezrProfile,
    error,
  } = await useFetch('/api/profile/reporting_token', {
    deep: true
  });

  const itemsPerPageOptions = [10, 25, 50, 100, -1];
  const itemsPerPageStored = useLocalStorage('ezm.itemsPerPage', 10);
  const itemsPerPageInner = ref(itemsPerPageStored.value);

  const itemsPerPage = computed({
    get() {
      return itemsPerPageInner.value;
    },
    set(value) {
      itemsPerPageInner.value = value;
      if (value !== -1) {
        itemsPerPageStored.value = value;
      }
    },
  });

  if (!error.value) {
    prepareClient(
      '/report/api', // ezREEPORT API url
      { token: ezrProfile.value.token },
    );
  }

  return {
    error,
    itemsPerPageOptions,
    itemsPerPage,
  };
}
