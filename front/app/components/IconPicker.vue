<template>
  <v-card>
    <template #text>
      <v-text-field
        v-model="search"
        :label="$t('search')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        autofocus
      />

      <v-empty-state
        v-if="iconLines.length === 0"
        icon="mdi-ghost-outline"
        :title="$t('noMatch')"
      />

      <v-virtual-scroll
        v-else
        :height="scrollerHeight"
        :items="iconLines"
      >
        <template #default="{ item: icons }">
          <div class="d-flex justify-space-between pa-1 ga-2">
            <v-btn
              v-for="icon in icons"
              :key="icon"
              :color="props.modelValue === icon ? 'primary' : 'default'"
              :icon="icon"
              class="rounded"
              @click="emit('update:modelValue', icon)"
            />
          </div>
        </template>
      </v-virtual-scroll>
    </template>
  </v-card>
</template>

<script setup>
import iconsMeta from '@mdi/svg/meta.json';

const allIcons = iconsMeta.map((icon) => `mdi-${icon.name}`);

const emit = defineEmits({
  'update:modelValue': (selection) => selection,
});

const props = defineProps({
  modelValue: {
    type: [String, null],
    required: true,
  },
  itemsPerLine: {
    type: Number,
    default: 5,
  },
  scrollerHeight: {
    type: Number,
    default: 300,
  },
});

const search = shallowRef('');

const filteredIcons = computed(() => {
  if (!search.value) { return allIcons; }

  return allIcons.filter((icon) => icon.includes(search.value));
});

const iconLines = computed(() => {
  const nbLines = Math.ceil(filteredIcons.value.length / props.itemsPerLine);
  const lines = [];
  for (let i = 0; i < nbLines; i += 1) {
    lines.push(filteredIcons.value.slice(i * props.itemsPerLine, (i + 1) * props.itemsPerLine));
  }
  return lines;
});
</script>
