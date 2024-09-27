import {
  computed,
  toValue,
} from '#imports';

export default function useFilters(data, emit) {
  const emptySymbol = Symbol('empty filter');

  const resetFilters = (value = { search: '' }) => {
    emit('update:modelValue', value);
  };

  const setFilterValue = (field, value) => {
    let v = value;

    // Cleaning values for string
    if (typeof value === 'string') {
      // Keep empty value if we want an empty filter
      if (value === emptySymbol) {
        v = '';
      }

      // Remove filter if value is empty
      if (value === '') {
        v = undefined;
      }
    }

    // Cleaning values for array
    if (Array.isArray(value)) {
      // Keep empty array if we want an empty filter
      if (value.length === 1 && value[0] === emptySymbol) {
        v = '';
      }

      // Remove filter if value is an empty array
      if (value.length === 0) {
        v = undefined;
      }
    }

    // Updating filters
    emit('update:modelValue', {
      ...toValue(data),
      [field]: v,
    });
  };

  /**
   * Allow usage of `v-model="filters.myField"`
   */
  const filters = new Proxy({}, {
    // Getter to keep reactivity
    get: (target, prop) => toValue(data)[prop],
    // Setter to update model
    set: (target, prop, value) => {
      setFilterValue(prop, value);
      return true;
    },
  });

  return {
    emptySymbol,
    filters,
    resetFilters,
  };
}
