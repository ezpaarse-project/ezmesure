<template>
  <div>
    <v-toolbar
      :title="`${$t('menu.adminReport')} / ${$t('report.admin.adminTab')}`"
      color="transparent"
      density="comfortable"
    >
      <template #prepend>
        <v-btn
          icon="mdi-menu"
          @click="toggle()"
        />
      </template>

      <template #append>
        <v-dialog width="75%">
          <template #activator="{ props: dialog }">
            <v-btn
              :text="$t('menu.api')"
              prepend-icon="mdi-file-document-outline"
              color="primary"
              variant="tonal"
              class="mr-4"
              v-bind="dialog"
            />
          </template>

          <v-card>
            <template #text>
              <iframe
                src="/report/api/doc/"
                title="ezReport API Reference"
                loading="lazy"
                width="100%"
                height="800"
                frameborder="0"
              />
            </template>
          </v-card>
        </v-dialog>

        <v-dialog width="1200px">
          <template #activator="{ props: dialog }">
            <v-btn
              :text="$t('report.health')"
              prepend-icon="mdi-heart-outline"
              color="green"
              variant="tonal"
              class="mr-4"
              v-bind="dialog"
            />
          </template>

          <v-card>
            <template #text>
              <ezr-health-status />
            </template>
          </v-card>
        </v-dialog>
      </template>
    </v-toolbar>

    <SkeletonPageLoader
      v-if="error"
      :error="error"
      show
      show-refresh
      @click:refresh="refresh()"
    />

    <div v-else>
      <v-container fluid>
        <v-row>
          <v-col>
            <v-card>
              <template #text>
                <ezr-generation-table
                  v-model:items-per-page="itemsPerPage"
                  :items-per-page-options="itemsPerPageOptions"
                />
              </template>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-card>
              <template #text>
                <ezr-cron-list />
              </template>
            </v-card>
          </v-col>
          <v-col>
            <v-card>
              <template #text>
                <ezr-template-tag-table />
              </template>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { toggle } = useDrawerStore();

const {
  error,
  itemsPerPage,
  itemsPerPageOptions,
  refresh,
} = await useEzr();
</script>
