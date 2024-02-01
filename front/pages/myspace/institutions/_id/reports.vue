<template>
  <section>
    <ToolBar :title="institution.name">
      <v-tooltip v-if="isAdmin" right>
        <template #activator="{ attrs, on }">
          <v-btn
            class="ml-2"
            icon
            v-bind="attrs"
            @click="goToInstitutionPage"
            v-on="on"
          >
            <v-icon>
              mdi-page-previous-outline
            </v-icon>
          </v-btn>
        </template>

        {{ $t('institutions.institution.goToPage') }}
      </v-tooltip>

      <v-spacer />

      <DocDialog>
        <template #activator="{ attrs, on }">
          <v-btn text color="primary" v-bind="attrs" v-on="on">
            <v-icon left>
              mdi-file-document-outline
            </v-icon>
            {{ $t('menu.api') }}
          </v-btn>
        </template>
      </DocDialog>

      <HealthDialog>
        <template #activator="{ attrs, on }">
          <v-btn text color="success" v-bind="attrs" v-on="on">
            <v-icon left>
              mdi-heart-outline
            </v-icon>
            {{ $t('report.health') }}
          </v-btn>
        </template>
      </HealthDialog>
    </ToolBar>

    <v-card-text class="pa-0">
      <ezr-task-cards
        :namespace="institution.id"
        :allowed-namespaces="allowedInstitutions"
        hide-namespace-selector
      />
    </v-card-text>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import HealthDialog from '~/components/report/HealthDialog.vue';
import DocDialog from '~/components/report/DocDialog.vue';

export default {
  layout: 'reporting',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    HealthDialog,
    DocDialog,
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
    };
  },
  computed: {
    allowedInstitutions() {
      return this.$auth.user.memberships.map((m) => m.institutionId);
    },
    isAdmin() {
      return this.$auth.user?.isAdmin;
    },
  },
  methods: {
    goToInstitutionPage() {
      this.$router.push({ path: `/institutions/${this.institution.id}` });
    },
  },
};
</script>
