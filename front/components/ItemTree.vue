<template>
  <div>
    <template v-for="item in items">
      <div v-if="!item.hide" :key="item.value || item.text">
        <slot v-if="item.value" name="item" :item="item">
          {{ item.text || item.value }}
        </slot>
        <slot v-else name="group" :item="item">
          {{ item.text || item.value }}
        </slot>

        <ItemTree v-if="Array.isArray(item.items)" :items="item.items" class="pl-4">
          <template #item="{ item: subitem }">
            <slot name="item" :item="subitem" />
          </template>

          <template #group="{ item: subitem }">
            <slot name="group" :item="subitem" />
          </template>
        </ItemTree>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ItemTree',
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
};
</script>
