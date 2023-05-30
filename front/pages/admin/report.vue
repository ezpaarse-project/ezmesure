<template>
  <section>
    <ToolBar
      :title="$t('menu.adminReport')"
    >
      <v-spacer />

      <v-btn text color="success" @click="showHealthDialog = true">
        <v-icon left>
          mdi-heart-outline
        </v-icon>
        {{ $t('report.health') }}
      </v-btn>

      <template #extension>
        <v-tabs v-model="currentTab" grow>
          <v-tab>{{ $t('report.admin.taskTab') }}</v-tab>
          <v-tab>{{ $t('report.admin.activityTab') }}</v-tab>
          <v-tab>{{ $t('report.admin.adminTab') }}</v-tab>
        </v-tabs>
      </template>
    </ToolBar>

    <v-card-text>
      <v-tabs-items v-model="currentTab">
        <!-- tasks tab -->
        <v-tab-item class="pa-1">
          <v-row>
            <v-col>
              <v-card>
                <ezr-task-table :current-namespace.sync="currentInstitution" />
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-card>
                <ezr-template-list />
              </v-card>
            </v-col>
          </v-row>
        </v-tab-item>

        <!-- activity tab -->
        <v-tab-item class="pa-1">
          <v-row>
            <v-col>
              <v-card>
                <ezr-history-table />
              </v-card>
            </v-col>
          </v-row>
        </v-tab-item>

        <!-- "admin" tab -->
        <v-tab-item class="pa-1 w-800 mx-auto">
          <v-row>
            <v-col>
              <v-card>
                <ezr-cron-list />
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-card>
                <ezr-queue-list />
              </v-card>
            </v-col>
          </v-row>
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>

    <HealthDialog v-model="showHealthDialog" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import HealthDialog from '~/components/report/HealthDialog.vue';

export default {
  layout: 'reporting',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    HealthDialog,
  },
  data: () => ({
    showHealthDialog: false,
    currentTab: 0,
  }),
  computed: {
    currentInstitution: {
      get() {
        return this.$route.query.institution?.toString();
      },
      set(institution) {
        this.$router.replace({ query: { institution } });
      },
    },
  },
};
</script>
