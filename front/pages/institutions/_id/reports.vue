<template>
  <section>
    <ToolBar :title="institution.name">
      <v-spacer />

      <v-btn text color="success" @click="showHealthDialog = true">
        <v-icon left>
          mdi-heart-outline
        </v-icon>
        {{ $t('report.health') }}
      </v-btn>
    </ToolBar>

    <v-card-text class="pa-0">
      <ezr-task-cards
        :namespace="institution.id"
        :allowed-namespaces="allowedInstitutions"
        hide-namespace-selector
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
  async asyncData({
    $axios,
    store,
    params,
    app,
  }) {
    let institution = null;

    try {
      institution = await $axios.$get(`/institutions/${params.id}`);
    } catch (e) {
      if (e.response?.status === 404) {
        institution = {};
      } else {
        store.dispatch('snacks/error', app.i18n.t('institutions.unableToRetriveInformations'));
      }
    }

    return {
      institution,
      showHealthDialog: false,
    };
  },
  computed: {
    allowedInstitutions() {
      return this.$auth.user.memberships.map((m) => m.institutionId);
    },
  },
};
</script>
