<template>
  <v-list-item :title="modelValue.id" style="width: 98%;">
    <v-list-item-subtitle style="opacity: 1;">
      <v-menu
        v-model="isCredentialsMenuOpen"
        :close-on-content-click="false"
        width="1200px"
      >
        <template #activator="{ props: menu }">
          <v-chip
            :text="$t('harvest.sessions.counts.credentials', status?._count?.credentials?.harvestable ?? status?._count?.credentials?.all ?? 0)"
            :color="(status?._count?.credentials?.harvestable ?? 0) > 0 ? 'success' : 'error'"
            :disabled="!status"
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

      <v-menu
        v-model="isReportsMenuOpen"
        :close-on-content-click="false"
        width="500px"
      >
        <template #activator="{ props: menu }">
          <v-chip
            :text="$t('harvest.sessions.counts.reportTypes', props.modelValue.reportTypes.length)"
            :color="props.modelValue.reportTypes.length > 0 ? 'accent' : 'error'"
            prepend-icon="mdi-file"
            size="small"
            variant="flat"
            class="mr-2 mt-1"
            v-bind="menu"
          />
        </template>

        <SushiHarvestSessionReports :session="modelValue" :status="status">
          <template #append>
            <v-btn
              icon="mdi-close"
              color="secondary"
              variant="text"
              density="comfortable"
              @click="isReportsMenuOpen = false"
            />
          </template>
        </SushiHarvestSessionReports>
      </v-menu>

      <v-chip
        v-if="modelValue.sendEndMail"
        v-tooltip:top="$t('harvest.sessions.form.settings.sendEndMail')"
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
            :title="$t('modify')"
            :disabled="modelValue.status !== 'prepared'"
            prepend-icon="mdi-pencil"
            @click="emit('click:update', modelValue)"
          />

          <v-list-item
            :title="$t('delete')"
            prepend-icon="mdi-delete"
            @click="deleteSession()"
          />

          <v-divider />

          <v-list-item
            :title="$t('harvest.sessions.start')"
            :disabled="modelValue.status !== 'prepared'"
            prepend-icon="mdi-play"
            @click="startSession()"
          />

          <v-list-item
            :title="$t('harvest.sessions.stop')"
            :disabled="modelValue.status !== 'running'"
            prepend-icon="mdi-stop"
            @click="stopSession()"
          />

          <v-list-item
            v-if="clipboard"
            :title="$t('copyId')"
            prepend-icon="mdi-identifier"
            @click="copyId()"
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

const emit = defineEmits({
  'update:model-value': (value) => value === null || !!value,
  'click:update': (value) => !!value,
});

const { t, locale } = useI18n();
const snacks = useSnacksStore();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();

const isCredentialsMenuOpen = shallowRef(false);
const isReportsMenuOpen = shallowRef(false);

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

async function startSession() {
  try {
    await $fetch(`/api/harvests-sessions/${props.modelValue.id}/_start`, {
      method: 'POST',
      body: {},
    });

    // Waits for 250ms, in order to let API actually start the session
    setTimeout(() => {
      emit('update:model-value', props.modelValue);
    }, 250);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
}

function stopSession() {
  openConfirm({
    onAgree: async () => {
      try {
        await $fetch(`/api/harvests-sessions/${props.modelValue.id}/_stop`, {
          method: 'POST',
        });

        // Waits for 250ms, in order to let API actually start the session
        setTimeout(() => {
          emit('update:model-value', props.modelValue);
        }, 250);
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
      }
    },
  });
}

function deleteSession() {
  openConfirm({
    onAgree: async () => {
      try {
        await $fetch(`/api/harvests-sessions/${props.modelValue.id}`, {
          method: 'DELETE',
        });

        emit('update:model-value', null);
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
      }
    },
  });
}
</script>
