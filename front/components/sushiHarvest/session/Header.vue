<template>
  <v-list-item
    :title="modelValue.id"
    style="width: 98%;"
  >
    <v-list-item-subtitle style="opacity: 1;">
      <v-menu
        v-model="isCredentialsMenuOpen"
        :close-on-content-click="false"
        width="75vw"
      >
        <template #activator="{ props: menu }">
          <v-chip
            :text="$t('harvest.sessions.counts.credentials', status?._count?.credentials?.harvestable ?? status?._count?.credentials?.all ?? 0)"
            :color="(status?._count?.credentials?.harvestable ?? 0) > 0 ? 'success' : 'error'"
            prepend-icon="mdi-key"
            size="small"
            variant="flat"
            class="mr-2 mt-1"
            v-bind="menu"
          />
        </template>

        <SushiHarvestSessionCredentials :session="modelValue" :status="status">
          <template #append>
            <v-btn
              icon="mdi-close"
              color="secondary"
              variant="text"
              density="comfortable"
              @click="isCredentialsMenuOpen = false"
            />
          </template>
        </SushiHarvestSessionCredentials>
      </v-menu>

      <v-chip
        :text="`${props.modelValue.beginDate} ~ ${props.modelValue.endDate}`"
        prepend-icon="mdi-calendar-range"
        size="small"
        variant="outlined"
        class="mr-2 mt-1"
      />

      <v-chip
        v-tooltip:top="props.modelValue.reportTypes.join(', ').toUpperCase()"
        :text="$t('harvest.sessions.counts.reportTypes', props.modelValue.reportTypes.length)"
        prepend-icon="mdi-file"
        size="small"
        variant="outlined"
        class="mr-2 mt-1"
      />

      <v-chip
        v-if="modelValue.sendEndMail"
        v-tooltip:top="$t('harvest.sessions.sendEndMail')"
        size="small"
        variant="outlined"
        class="mr-2 mt-1"
      >
        <v-icon icon="mdi-email" />
      </v-chip>

      <v-chip
        v-if="status?.runningTime"
        v-tooltip:top="$t('harvest.sessions.startedAt', { date: dateFormat(modelValue?.startedAt, locale) })"
        :text="runningTime"
        prepend-icon="mdi-timer-outline"
        size="small"
        variant="outlined"
        class="mr-2 mt-1"
      />
    </v-list-item-subtitle>

    <template #append>
      <template v-if="status">
        <SushiHarvestSessionProgress
          v-if="!!modelValue.startedAt"
          :status="status"
          :job-count="modelValue._count.jobs"
        />
        <v-chip
          v-else
          :text="$t('harvest.sessions.notStarted')"
          color="red"
          class="mr-2"
        />
      </template>

      <v-menu>
        <template #activator="{ props: menu }">
          <v-btn
            icon="mdi-dots-horizontal"
            variant="plain"
            density="compact"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            v-if="clipboard"
            :title="$t('copyId')"
            prepend-icon="mdi-identifier"
            @click="copyId(item)"
          />
        </v-list>
      </v-menu>
    </template>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();

const isCredentialsMenuOpen = ref(false);

// eslint-disable-next-line no-underscore-dangle
const status = computed(() => props.modelValue._status);
const runningTime = useTimeAgo(() => status.value?.runningTime ?? 0);

/**
 * Put ID into clipboard
 */
async function copyId() {
  try {
    await copy(props.modelValue.id);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
