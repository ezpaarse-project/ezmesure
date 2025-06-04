<template>
  <div>
    <SkeletonPageBar
      :title="`${$t('menu.harvest.title')} / ${$t('harvest.dashboard.title')}`"
      icons
    />

    <v-container>
      <v-expansion-panels>
        <v-expansion-panel>
          <template #title>
            <v-icon icon="mdi-file-alert" start />

            {{ $t('harvest.dashboard.unsupportedButHarvested.title') }}

            <v-spacer />

            <v-btn
              v-if="panelsRefresh.unsupportedButHarvested"
              :loading="panelsRefresh.unsupportedButHarvested.status === 'pending'"
              icon="mdi-reload"
              variant="tonal"
              color="primary"
              density="comfortable"
              class="mr-2"
              @click.stop="() => panelsRefresh.unsupportedButHarvested.execute()"
            />
          </template>

          <template #text>
            <HarvestDashboardUnsupportedButHarvested
              :define-refresh="(def) => panelsRefresh.unsupportedButHarvested = def"
            />
          </template>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { t } = useI18n();

const panelsRefresh = ref({});
</script>
