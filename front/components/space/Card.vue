<template>
  <v-card
    :title="modelValue.name"
    :text="modelValue.description"
    variant="outlined"
    :style="{ borderColor: repoColors.get(modelValue.type), borderWidth: '2px' }"
  >
    <template #subtitle>
      <v-chip
        :text="modelValue.id"
        prepend-icon="mdi-identifier"
        size="small"
        density="comfortable"
        class="mr-2"
      />

      <RepositoryTypeChip
        :model-value="modelValue"
        size="small"
        density="comfortable"
      />
    </template>

    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="$t('open')"
        :href="`/kibana/s/${modelValue.id}`"
        append-icon="mdi-open-in-app"
        variant="text"
        size="small"
        class="mr-2"
        @click.prevent="openInTab(`/kibana/s/${modelValue.id}`, modelValue.id)"
      />
    </template>
  </v-card>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { openInTab } = useSingleTabLinks('kibanaSpaces');
</script>
