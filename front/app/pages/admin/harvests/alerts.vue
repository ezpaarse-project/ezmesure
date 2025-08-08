<template>
  <div>
    <SkeletonPageBar
      :title="`${$t('menu.harvest.group')} / ${$t('sushi.alerts.title')}`"
      icons
    />

    <v-container>
      <v-expansion-panels>
        <v-expansion-panel>
          <template #title>
            <v-icon icon="mdi-file-alert" start />

            {{ $t('sushi.alerts.unsupportedButHarvested.title') }}

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
            <SushiAlertsUnsupportedButHarvested
              :define-refresh="(def) => panelsRefresh.unsupportedButHarvested = def"
            />
          </template>
        </v-expansion-panel>

        <v-expansion-panel>
          <template #title>
            <v-icon icon="mdi-api" start />

            {{ $t('sushi.alerts.endpoint.title') }}

            <v-spacer />

            <v-btn
              v-if="panelsRefresh.endpoint"
              :loading="panelsRefresh.endpoint.status === 'pending'"
              icon="mdi-reload"
              variant="tonal"
              color="primary"
              density="comfortable"
              class="mr-2"
              @click.stop="() => panelsRefresh.endpoint.execute()"
            />
          </template>

          <template #text>
            <SushiAlertsEndpoint
              :define-refresh="(def) => panelsRefresh.endpoint = def"
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

const panelsRefresh = ref({});
</script>
