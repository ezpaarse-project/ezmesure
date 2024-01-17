<template>
  <section>
    <ToolBar :title="$t('report.title')">
      <v-spacer />

      <v-btn text color="success" @click="showHealthDialog = true">
        <v-icon left>
          mdi-heart-outline
        </v-icon>
        {{ $t('report.health') }}
      </v-btn>
    </ToolBar>

    <v-card-text class="pa-0">
      <ezr-task-table
        :current-namespace.sync="currentInstitution"
        :allowed-namespaces="allowedInstitutions"
      />
    </v-card-text>

    <HealthDialog v-model="showHealthDialog" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import HealthDialog from '~/components/report/HealthDialog.vue';

export default {
  layout: 'reporting',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    HealthDialog,
  },
  data: () => ({
    showHealthDialog: false,
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
    allowedInstitutions() {
      return this.$auth.user.memberships.map((m) => m.institutionId);
    },
  },
};
</script>
