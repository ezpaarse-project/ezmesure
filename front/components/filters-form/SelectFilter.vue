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
    <template v-if="$scopedSlots.selection" #selection="selection">
      <slot name="selection" v-bind="selection" />
    </template>

    <template #item="item">
      <slot name="item" v-bind="item">
        <v-list-item v-bind="item.attrs" v-on="item.on">
          <v-list-item-title>
            {{ item.item.text }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="item.item.subtext">
            {{ item.item.subtext }}
          </v-list-item-subtitle>
        </v-list-item>
      </slot>
    </template>

    <template v-if="$scopedSlots['append-outer']" #append-outer>
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
