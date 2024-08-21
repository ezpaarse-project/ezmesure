<template>
  <v-card
    color="black"
    style="overflow-y: auto;"
  >
    <template #text>
      <div
        v-for="(entry, i) in entries"
        :key="i"
      >
        <slot name="entry" :item="entry">
          <slot v-if="entry.date" name="date" :item="entry" :value="entry.date">
            <span class="text-gray">{{ entry.date }}</span>
          </slot>

          <slot v-if="entry.value" name="value" :item="entry" :value="entry.value">
            <span :class="`text-${entry.color} mx-1`">{{ entry.value }}:</span>
          </slot>

          <slot v-if="entry.text" name="text" :item="entry" :value="entry.text">
            <span style="word-break: break-word;">{{ entry.text }}</span>
          </slot>
        </slot>
      </div>
    </template>
  </v-card>
</template>

<script setup>
const logColors = new Map([
  ['info', 'green'],
  ['verbose', 'green'],
  ['warn', 'orange'],
  ['warning', 'orange'],
  ['error', 'red'],
]);

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  itemValue: {
    type: String,
    default: () => 'type',
  },
  itemText: {
    type: String,
    default: () => 'message',
  },
});

const entries = computed(
  () => props.modelValue
    .map((item) => {
      const value = item[props.itemValue];
      const text = item[props.itemText];
      return {
        raw: item,
        date: item.date,
        value,
        text,
        color: logColors.get(value) || 'white',
      };
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1)),
);
</script>
