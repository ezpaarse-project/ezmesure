<template>
  <v-menu
    v-if="modelValue"
    close-delay="200"
    open-on-hover
  >
    <template #activator="{ props: menu }">
      <v-avatar
        :icon="icon.icon"
        :color="icon.color"
        density="comfortable"
        v-bind="menu"
      />
    </template>

    <v-card
      :title="statusText.title"
      :subtitle="harvestedAt"
      min-width="350"
      max-width="500"
    >
      <template #text>
        <v-row>
          <v-col>
            <p>{{ statusText.text }}</p>
          </v-col>
        </v-row>

        <v-row v-if="counts.length > 0">
          <v-col>
            <i18n-t v-for="item in counts" :key="item.path" :keypath="item.path">
              <template #count>
                <strong>{{ item.value }}</strong>
              </template>
            </i18n-t>
          </v-col>
        </v-row>

        <v-row v-if="(modelValue.sushiExceptions?.length ?? 0) > 0">
          <v-col>
            <p class="text-subtitle-2">
              {{ $t('sushi.messagesFromEndpoint') }}
            </p>

            <SushiHarvestLogs :model-value="modelValue.sushiExceptions" item-value="severity" />
          </v-col>
        </v-row>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});

const { t, te } = useI18n();

const harvestedAt = useDateFormat(computed(() => props.modelValue?.harvestedAt));

const icon = computed(() => harvestStatus.get(props.modelValue?.status));
const counts = computed(() => {
  const fields = ['insertedItems', 'updatedItems', 'failedItems'];

  return fields.map(
    (field) => {
      const value = props.modelValue?.[field] ?? 0;
      if (!value) {
        return undefined;
      }

      return {
        path: `sushi.${field}`,
        value,
      };
    },
  ).filter((x) => !!x);
});
const statusText = computed(() => {
  const { status } = props.modelValue ?? {};
  const titleKey = `tasks.status.${status}`;
  const textKey = `tasks.statusDescriptions.${status}`;
  return {
    title: te(titleKey) ? t(titleKey) : status,
    text: te(textKey) ? t(textKey) : '',
  };
});
</script>
