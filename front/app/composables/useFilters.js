import {
  toValue,
  ref,
  shallowRef,
  computed,
  watch,
} from '#imports';
import { parse, format } from 'date-fns';

const DATE_FORMAT = 'yyyy-MM-dd';

/**
 *
 *
 * @param {MaybeRefOrGetter<Record<string, unknown>>} data
 * @param {(event: string, value: Record<string, unknown>) => void} emit
 * @returns
 */
export default function useFilters(data, emit) {
  // Symbol used to not confuse '' and undefined with actual empty value
  const emptySymbol = Symbol('empty filter');

  const filters = ref(toValue(data));

  // Apply updates to internal data
  watch(() => data, (value) => {
    filters.value = value;
  });

  watch(filters, (value) => {
    // Updating filters
    emit('update:modelValue', { ...value });
  }, { deep: true });

  function resetFilters(value = { search: '' }) {
    filters.value = value;
    emit('update:modelValue', value);
  }

  function defineStringFilter(key) {
    const modifier = shallowRef(filters.value[`${key}[not]`] ? 'not' : '');

    const state = computed({
      get: () => filters.value[key] ?? filters.value[`${key}[not]`],
      set: (value) => {
        let val = value;
        // Remove filter if value is empty
        if (value === '') {
          val = undefined;
        }
        // Keep empty value if we want an empty filter
        if (value === emptySymbol) {
          val = '';
        }

        if (modifier.value) {
          filters.value[`${key}[${modifier.value}]`] = val;
          return;
        }
        filters.value[key] = val;
      },
    });

    watch(modifier, (value, oldValue) => {
      const oldProp = oldValue ? `${key}[${oldValue}]` : key;
      const newProp = value ? `${key}[${value}]` : key;

      filters.value[newProp] = filters.value[oldProp];
      filters.value[oldProp] = undefined;
    });

    return { modifier, state };
  }

  function defineArrayFilter(key) {
    const modifier = shallowRef(filters.value[`${key}[some]`] ? 'some' : 'every');

    const state = computed({
      get: () => filters.value[`${key}[every]`] ?? filters.value[`${key}[some]`],
      set: (value) => {
        let val = value;
        // Keep empty array if we want an empty filter
        if (value.length === 1 && value[0] === emptySymbol) {
          val = '';
        }
        // Remove filter if value is an empty array
        if (value.length === 0) {
          val = undefined;
        }

        filters.value[`${key}[${modifier.value}]`] = val;
      },
    });

    watch(modifier, (value, oldValue) => {
      filters.value[`${key}[${value}]`] = [...(filters.value[`${key}[${oldValue}]`] ?? [])];
      filters.value[`${key}[${oldValue}]`] = undefined;
    });

    return { modifier, state };
  }

  function defineDateFilter(key) {
    const modifier = shallowRef(filters.value[`${key}[gte]`] ? 'gte' : 'lte');

    const state = computed({
      get: () => {
        const value = filters.value[`${key}[gte]`] ?? filters.value[`${key}[lte]`];
        return value && parse(value, DATE_FORMAT, new Date());
      },
      set: (value) => {
        let val = value;
        // Remove filter if value is empty
        if (value === '') {
          val = undefined;
        }
        // Keep empty value if we want an empty filter
        if (value === emptySymbol) {
          val = '';
        }

        filters.value[`${key}[${modifier.value}]`] = val && format(val, DATE_FORMAT);
      },
    });

    watch(modifier, (value, oldValue) => {
      filters.value[`${key}[${value}]`] = filters.value[`${key}[${oldValue}]`];
      filters.value[`${key}[${oldValue}]`] = undefined;
    });

    return { modifier, state };
  }

  return {
    emptySymbol,
    filters,
    resetFilters,
    defineStringFilter,
    defineArrayFilter,
    defineDateFilter,
  };
}
