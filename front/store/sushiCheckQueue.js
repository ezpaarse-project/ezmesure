import {
  defineStore,
  useI18n,
  useSnacksStore,
  ref,
  computed,
} from '#imports';

export const useSushiCheckQueueStore = defineStore('sushiCheckQueue', () => {
  const { t } = useI18n();
  const snacks = useSnacksStore();

  const queue = ref([]);
  const testing = ref(undefined);

  async function checkSingleConnection(item) {
    testing.value = { ...item };
    await item.onStart();
    try {
      const { connection } = await $fetch(`/api/sushi/${item.id}/_check_connection`, { method: 'POST' });
      testing.value.status = connection.status;
      await item.onComplete(undefined, connection);
    } catch (err) {
      testing.value.status = 'failed';
      await item.onComplete(err);
      snacks.error(t('institutions.sushi.cannotCheckCredentials', { name: item.vendor }), err);
    }
    await new Promise((resolve) => { setTimeout(() => resolve(), 1000); });
    testing.value = undefined;
  }

  async function checkNextConnection() {
    const credentials = queue.value.shift();
    if (!credentials) {
      return;
    }
    await checkSingleConnection(credentials);
    checkNextConnection();
  }

  function addToCheck(credentials, options) {
    if (typeof credentials !== 'object') {
      return;
    }

    queue.value.push({
      id: credentials.id,
      vendor: credentials.endpoint?.vendor,
      name: credentials.institution?.name,
      onStart: options?.onStart || (() => {}),
      onComplete: options?.onComplete || (() => {}),
    });

    if (!testing.value) {
      checkNextConnection();
    }
  }

  const isTesting = computed(() => testing.value && !testing.value.status);
  const currentlyTesting = computed(() => testing.value);
  const idsInQueue = computed(() => new Set(queue.value.map((c) => c.id)));

  return {
    addToCheck,
    idsInQueue,
    isTesting,
    currentlyTesting,
  };
});
