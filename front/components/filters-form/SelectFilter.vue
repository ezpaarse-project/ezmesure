<template>
  <v-autocomplete
    :value="value ?? []"
    :items="items"
    :label="label"
    :prepend-icon="icon"
    :return-object="returnObject"
    :multiple="multiple"
    hide-details
    @change="updateValue($event)"
  >
    <template #append-outer>
      <slot name="append-outer" />
    </template>
  </v-autocomplete>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: [String, Object, Array],
      default: () => undefined,
    },
    items: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: undefined,
    },
    icon: {
      type: String,
      default: undefined,
    },
    returnObject: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (v) => !!v,
  },
  methods: {
    /**
     * @param {string | object | Array} val
     */
    updateValue(val) {
      const isEmptyArray = Array.isArray(val) && val.length <= 0;
      const isEmptyObject = typeof val === 'object' && Object.keys(val).length <= 0;
      const isEmpty = !val;

      if (isEmpty || isEmptyArray || isEmptyObject) {
        this.$emit('input', undefined);
        return;
      }

      this.$emit('input', val);
    },
  },
});
</script>
