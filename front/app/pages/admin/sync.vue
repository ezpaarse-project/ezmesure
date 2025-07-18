<template>
  <div>
    <SkeletonPageBar
      :refresh="refresh"
      icons
      @update:model-value="debouncedRefresh()"
    >
      <template #title>
        {{ $t('menu.sync') }}

        <v-chip
          v-if="syncState?.data?.startedAt"
          :text="startedAt"
          prepend-icon="mdi-calendar-blank"
          size="small"
          variant="outlined"
          class="ml-2"
        />

        <v-chip
          v-if="syncState?.data?.runningTime"
          :text="runningTime"
          prepend-icon="mdi-timer-outline"
          size="small"
          variant="outlined"
          class="ml-2"
        />
      </template>

      <v-btn
        v-tooltip="$t('sync.start')"
        :disabled="isSynchronizing"
        icon="mdi-play"
        color="primary"
        variant="tonal"
        density="comfortable"
        class="mr-2"
        @click="startSync()"
      />
    </SkeletonPageBar>

    <v-container>
      <v-row>
        <v-col>
          <v-alert prominent v-bind="statusAlert">
            <template v-if="isSynchronizing" #prepend>
              <v-progress-circular
                size="44"
                indeterminate
              />
            </template>
          </v-alert>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <div class="text-overline primary--text">
            Elastic
          </div>

          <v-row>
            <v-col>
              <SyncCard
                :title="$t('sync.repositories')"
                :value="syncState?.data?.result?.repositories ?? {}"
                :expected="syncState?.expected?.repositories ?? 0"
                :loading="isSynchronizing"
              />
            </v-col>

            <v-col>
              <SyncCard
                :title="$t('sync.repositoryAliases')"
                :value="syncState?.data?.result?.repositoryAliases ?? {}"
                :expected="syncState?.expected?.repositoryAliases ?? 0"
                :loading="isSynchronizing"
              />
            </v-col>

            <v-col>
              <SyncCard
                :title="$t('sync.users')"
                :value="syncState?.data?.result?.users ?? {}"
                :expected="syncState?.expected?.users ?? 0"
                :loading="isSynchronizing"
              />
            </v-col>

            <v-col>
              <SyncCard
                :title="$t('sync.elasticRoles')"
                :value="syncState?.data?.result?.elasticRoles ?? {}"
                :expected="syncState?.expected?.elasticRoles ?? 0"
                :loading="isSynchronizing"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-spacer class="py-4" />

      <v-row>
        <v-col cols="3">
          <div class="text-overline primary--text">
            Kibana
          </div>

          <v-row>
            <v-col>
              <SyncCard
                :title="$t('sync.spaces')"
                :value="syncState?.data?.result?.spaces ?? {}"
                :expected="syncState?.expected?.spaces ?? 0"
                :loading="isSynchronizing"
              />
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="6">
          <div class="text-overline primary--text">
            ezREEPORT
          </div>

          <v-row>
            <v-col cols="6">
              <SyncCard
                :title="$t('sync.ezreeportUsers')"
                :value="syncState?.data?.result?.ezreeportUsers ?? {}"
                :expected="syncState?.expected?.users ?? 0"
                :loading="isSynchronizing"
              />
            </v-col>

            <v-col cols="6">
              <SyncCard
                :title="$t('sync.ezreeportNamespaces')"
                :value="syncState?.data?.result?.ezreeportNamespaces ?? {}"
                :expected="syncState?.expected?.institutions ?? 0"
                :loading="isSynchronizing"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { t } = useI18n();
const snacks = useSnacksStore();

const {
  data: syncState,
  refresh,
} = await useFetch('/api/sync');

const startedAt = useDateFormat(() => syncState.value?.data?.startedAt ?? 0);
const runningTime = useTimeAgo(() => syncState.value?.data?.runningTime ?? 0);
const autoRefresh = useIntervalFn(refresh, 1000, { immediate: false });

const isSynchronizing = computed(() => syncState.value?.data.status === 'synchronizing');

const statusAlert = computed(() => {
  let key = syncState.value?.data?.status;
  if (syncState.value?.data?.hasErrors && !isSynchronizing.value) {
    key = 'error';
  }

  switch (key) {
    case 'synchronizing':
      return {
        color: 'info',
        text: t('sync.status.synchronizing'),
      };

    case 'completed':
      return {
        color: 'success',
        icon: 'mdi-check',
        text: t('sync.description.completed'),
      };

    case 'error':
      return {
        color: 'error',
        icon: 'mdi-alert-circle',
        title: t('sync.status.error'),
        text: t('sync.description.error'),
      };

    case 'idle':
    default:
      return {
        color: 'warning',
        icon: 'mdi-alert',
        title: t('sync.status.notSynced'),
        text: t('sync.description.notSynced'),
      };
  }
});

async function startSync() {
  if (isSynchronizing.value) {
    return;
  }

  try {
    syncState.value.data = await $fetch('/api/sync/_start', { method: 'POST' });
  } catch (err) {
    snacks.error(t('sync.unableToStart'), err);
  }
}

watch(
  isSynchronizing,
  (value) => {
    if (value) {
      // Auto refresh if synchronizing
      autoRefresh.resume();
    } else {
      // Stop auto refresh if not synchronizing
      autoRefresh.pause();
    }
  },
  { immediate: true },
);
</script>
