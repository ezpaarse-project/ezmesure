import {
  ref,
  computed,
  useAsyncData,
  useI18n,
  useSnacksStore,
  useLocalStorage,
} from '#imports';

/**
 * @typedef {object} CustomFetchOptions
 * @property {string} url URL to fetch
 * @property {(data: any) => any} transform Transform data before return
 *
 * @typedef {import('nitropack').NitroFetchOptions & CustomFetchOptions} FetchOptions
 * @typedef {import('nuxt/app').AsyncDataOptions} AsyncDataOptions
 *
 * @typedef {object} Params
 * @property {FetchOptions} fetch Params to pass to underlying `$fetch`
 * @property {AsyncDataOptions} [async] Params to pass to underlying `useAsyncData`
 * @property {Record<string, string>} [sortMapping] Mapping from Vuetify columns' keys to
 * API sort keys
 * @property {Record<string, any>} [data] Initial query options. Put dynamic params here,
 * "static" params should go in `fetch.params` or `fetch.query`
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

  const itemsPerPageOptions = [10, 25, 50, 100, -1];
  const itemsPerPageStored = useLocalStorage('ezm.itemsPerPage', params.data?.itemsPerPage ?? 10);
  const itemsPerPage = ref(itemsPerPageStored.value);

  /**
   * Unpaginated item counts in API
   */
  const itemLength = ref({
    total: 0,
    current: 0,
  });

  /**
   * Query options for the table
   */
  const query = ref({
    page: 1,
    sortBy: [{
      key: 'createdAt',
      order: 'asc',
    }],
    search: '',
    ...params.data,
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
          search: _search, // search parameter is q, and we're gonna use state one
          sortBy,
          ...queryParams
        } = query.value;
        // try to use sort mapping, fallback to original key
        const sort = sortBy.map(({ key }) => sortMapping.get(key) ?? key);
        const order = sortBy.map((v) => v.order);
        // transform query params
        fetchOpts[queryKey] = {
          ...queryParams,
          ...fetchOpts?.[queryKey],
          page: query.value.page,
          size: Math.max(itemsPerPage.value, 0),
          q: query.value.search,
          order,
          sort,
        };

        const res = await $fetch.raw(url, fetchOpts);

        // Update item length
        itemLength.value.current = Number.parseInt(res.headers.get('x-total-count'), 10) || 0;

        if (!itemLength.value.total) {
          itemLength.value.total = itemLength.value.current;
        }

        if (params?.fetch?.transform) {
          // eslint-disable-next-line no-underscore-dangle
          return params.fetch.transform(res._data);
        }
        // eslint-disable-next-line no-underscore-dangle
        return res._data;
      } catch (error) {
        snacks.error(t('anErrorOccurred'), error);
        throw error;
      }
    },
    {
      lazy: true,
      ...params.async,
    },
  );

  const onDataTableOptionsUpdate = ({ size, ...data }) => {
    if (Number.isInteger(size)) {
      itemsPerPage.value = size;
      // Prevent "all" from begin saved, allowing to select it for 1 page
      if (size !== -1) {
        itemsPerPageStored.value = size;
      }
    }
    query.value = {
      ...query.value,
      ...data,
    };
    return asyncData.refresh();
  };

  /**
   * Options to bind to `v-pagination`
   */
  const vPaginationOptions = computed(() => ({
    modelValue: query.value.page,
    length: Math.ceil(itemLength.value.current / itemsPerPage.value),

    'onUpdate:modelValue': (page) => onDataTableOptionsUpdate({ page }),
  }));

  /**
   * Options to bind to `v-data-table`
   */
  const vDataTableOptions = computed(() => ({
    items: asyncData.data.value ?? [],
    loading: asyncData.status.value === 'pending' && 'primary',
    page: query.value.page,
    itemsLength: itemLength.value.current,
    itemsPerPage: itemsPerPage.value,
    itemsPerPageOptions,
    sortBy: query.value.sortBy,

    'onUpdate:page': (page) => onDataTableOptionsUpdate({ page }),
    'onUpdate:sortBy': (sortBy) => onDataTableOptionsUpdate({ sortBy }),
    'onUpdate:search': (search) => onDataTableOptionsUpdate({ search }),
    'onUpdate:itemsPerPage': (size) => onDataTableOptionsUpdate({ size }),
  }));

  return {
    ...asyncData,
    itemLength,
    itemsPerPage,
    itemsPerPageOptions,
    query,
    vPaginationOptions,
    vDataTableOptions,
  };
}
