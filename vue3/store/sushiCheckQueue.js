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
    testing.value = item;
    await item.onStart();
    try {
      const { connection } = await $fetch(`/api/sushi/${item.id}/_check_connection`, { method: 'POST' });
      await item.onComplete(undefined, connection);
    } catch (e) {
      await item.onComplete(e);
      snacks.error(t('institutions.sushi.cannotCheckCredentials', { name: item.vendor }));
    }
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
      onStart: options?.onStart || (() => {}),
      onComplete: options?.onComplete || (() => {}),
    });

    if (!testing.value) {
      checkNextConnection();
    }
  }

  const isTesting = computed(() => !!testing.value);
  const currentlyTesting = computed(() => testing.value);
  const idsInQueue = computed(() => new Set(queue.value.map((c) => c.id)));

  return {
    addToCheck,
    idsInQueue,
    isTesting,
    currentlyTesting,
  };
});
