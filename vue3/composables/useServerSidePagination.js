import {
  ref,
  computed,
  useAsyncData,
  useI18n,
  useSnacksStore,
  useLocalStorage,
} from '#imports';

/**
 * @typedef {import('nitropack').NitroFetchOptions & { url: string }} FetchOptions
 * @typedef {import('nuxt/app').AsyncDataOptions} AsyncDataOptions
 *
 * @typedef {object} Params
 * @property {FetchOptions} fetch Params to pass to underlying `$fetch`
 * @property {string} fetch.url URL to fetch
 * @property {AsyncDataOptions} [async] Params to pass to underlying `useAsyncData`
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

  const itemsPerPage = useLocalStorage('ezm.itemsPerPage', params.data?.itemsPerPage ?? 10);

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
          size: Math.max(itemsPerPage.value, 0),
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
    params.async,
  );

  const onDataTableOptionsUpdate = ({ size, ...data }) => {
    if (Number.isInteger(size)) {
      itemsPerPage.value = size;
    }
    query.value = {
      ...query.value,
      ...data,
    };
    return asyncData.refresh();
  };

  /**
   * Options to bind to `v-data-table`
   */
  const vDataTableOptions = computed(() => ({
    items: asyncData.data.value ?? [],
    loading: asyncData.status.value === 'pending',
    page: query.value.page,
    itemsLength: itemLength.value.current,
    itemsPerPage: itemsPerPage.value,
    sortBy: query.value.sortBy,

    'onUpdate:page': (page) => onDataTableOptionsUpdate({ page }),
    'onUpdate:sortBy': (sortBy) => onDataTableOptionsUpdate({ sortBy }),
    'onUpdate:search': (search) => onDataTableOptionsUpdate({ search }),
    'onUpdate:itemsPerPage': (size) => onDataTableOptionsUpdate({ size }),
  }));

  return {
    ...asyncData,
    itemLength,
    query,
    vDataTableOptions,
  };
}
