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
          <v-tab>{{ $t('report.admin.templateTab') }}</v-tab>
          <v-tab>{{ $t('report.admin.activityTab') }}</v-tab>
          <v-tab>{{ $t('report.admin.adminTab') }}</v-tab>
        </v-tabs>
      </template>
    </ToolBar>

    <v-card-text>
      <v-tabs-items v-model="currentTab">
        <!-- tasks tab -->
        <v-tab-item class="pa-1">
          <ezr-task-table :current-namespace.sync="currentInstitution" />
        </v-tab-item>

        <!-- template tab -->
        <v-tab-item class="pa-1">
          <ezr-template-list />
        </v-tab-item>

        <!-- activity tab -->
        <v-tab-item class="pa-1">
          <ezr-history-table />
        </v-tab-item>

        <!-- "admin" tab -->
        <v-tab-item class="pa-1">
          <v-row>
            <v-col>
              <ezr-cron-list />
            </v-col>

            <v-col>
              <ezr-queue-list />
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
