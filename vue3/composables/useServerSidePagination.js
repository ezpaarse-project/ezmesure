import {
  ref,
  computed,
  useAsyncData,
  useI18n,
  useSnacksStore,
} from '#imports';

/**
 * @typedef {import('nitropack').NitroFetchOptions & { url: string }} FetchOptions
 * @typedef {object} Params
 * @property {FetchOptions} fetch Params to pass to underlying `$fetch`
 * @property {string} fetch.url URL to fetch
 * @property {Record<string, string>} [sortMapping] Mapping from Vuetify columns' keys to
 * API sort keys
 * @property {Record<string, any>} [data] Initial query options
 */

/**
 * @param {Params} params Params to setup pagination, not reactive.
 */
export default async function useServerSidePagination(params = {}) {
  if (!params?.fetch?.url) {
    throw new Error('Please provide a URL to fetch');
  }

  const snacks = useSnacksStore();
  const { t } = useI18n();

  const sortMapping = new Map(Object.entries(params.sortMapping ?? {}));

  /**
   * Unpaginated item counts in API
   */
  const itemLength = ref({
    total: 0,
    current: 0,
  });

  /**
   * Query options for the table'institutions-list'
   */
  const query = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [{
      key: 'createdAt',
      order: 'asc',
    }],
    search: '',
    ...(params.data ?? {}),
  });

  /**
   * Fetch data
   */
  const asyncData = await useAsyncData(
    `${params.fetch.url}.ssp`,
    async () => {
      try {
        // Extract url from fetch options
        const { url, ...fetchOpts } = params.fetch;
        const queryKey = fetchOpts.params ? 'params' : 'query';

        const {
          itemsPerPage,
          search,
          sortBy,
          ...queryParams
        } = query.value;
        // try to use sort mapping, fallback to original key
        const sort = sortMapping.get(sortBy?.[0]?.key) ?? sortBy?.[0]?.key;
        // transform query params
        fetchOpts[queryKey] = {
          ...(fetchOpts?.[queryKey] ?? {}),
          ...queryParams,
          page: query.value.page,
          size: Math.max(query.value.itemsPerPage, 0),
          q: query.value.search,
          order: sortBy?.[0]?.order,
          sort,
        };

        const res = await $fetch.raw(url, fetchOpts);

        // Update item length
        itemLength.value.current = res.headers.get('x-total-count');
        if (!itemLength.value.total) {
          itemLength.value.total = itemLength.value.current;
        }

        // eslint-disable-next-line no-underscore-dangle
        return res._data;
      } catch (error) {
        snacks.error(t('anErrorOccurred'));
        throw error;
      }
    },
  );

  /**
   * Options to bind to `v-data-table`
   */
  const vDataTableOptions = computed(() => ({
    items: asyncData.data.value,
    loading: asyncData.status.value === 'loading',
    page: query.value.page,
    itemsLength: itemLength.value.current,
    itemsPerPage: query.value.itemsPerPage,
    sortBy: query.value.sortBy,

    'onUpdate:options': (data) => {
      query.value = {
        ...query.value,
        ...data,
      };
      return asyncData.refresh();
    },
  }));

  return {
    ...asyncData,
    itemLength,
    query,
    vDataTableOptions,
  };
}
