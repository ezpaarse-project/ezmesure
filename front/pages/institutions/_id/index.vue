<template>
  <section>
    <ToolBar :title="$t('institutions.institution.title')">
      <v-spacer />

      <template v-if="institution && canEdit">
        <template v-if="isAdmin">
          <v-btn color="primary" text :to="`/institutions/${institutionId}/sushi`">
            <v-icon left>
              mdi-key
            </v-icon>
            {{ $t('institutions.sushi.credentials') }}
          </v-btn>
          <v-btn color="primary" text :to="`/institutions/${institutionId}/members`">
            <v-icon left>
              mdi-account-multiple
            </v-icon>
            {{ $t('institutions.members.members') }}
          </v-btn>
        </template>

        <v-btn color="primary" text @click="editInstitution">
          <v-icon left>
            mdi-pencil
          </v-icon>
          {{ $t('modify') }}
        </v-btn>
      </template>
    </ToolBar>

    <v-card-text v-if="institution">
      <InstitutionCard :institution="institution" />
    </v-card-text>

    <v-card-text v-else-if="failedToFetch">
      <v-alert
        type="error"
        :value="true"
      >
        {{ $t('institutions.unableToRetriveInformations') }}
      </v-alert>
    </v-card-text>

    <v-card-text v-else-if="selfInstitution">
      <v-card class="mx-auto w-600">
        <v-card-text class="text-center">
          <p class="body-1">
            {{ $t('institutions.notMember') }}
          </p>

          <v-btn
            color="primary"
            @click="createInstitution"
          >
            {{ $t('institutions.declareMyInstitution') }}
          </v-btn>
        </v-card-text>
      </v-card>
    </v-card-text>

    <v-card-text v-else>
      <v-card class="mx-auto w-600">
        <v-card-text class="text-center">
          <v-icon size="50" class="mb-2">
            mdi-ghost
          </v-icon>

          <p class="body-1">
            {{ $t('institutions.doesNotExist') }}
          </p>
        </v-card-text>
      </v-card>
    </v-card-text>

    <InstitutionForm ref="institutionForm" @update="refreshInstitution" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import InstitutionForm from '~/components/InstitutionForm.vue';
import InstitutionCard from '~/components/InstitutionCard.vue';

const defaultLogo = require('@/static/images/logo-etab.png');

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    InstitutionForm,
    InstitutionCard,
  },
  async asyncData({
    $axios,
    params,
    $auth,
    redirect,
  }) {
    let institution = null;
    let failedToFetch = false;

    if (!$auth.hasScope('superuser') && !$auth.hasScope('institution_form')) {
      return redirect({ name: 'myspace' });
    }

    try {
      institution = await $axios.$get(`/institutions/${params.id}`);
    } catch (e) {
      if (e.response?.status !== 404) {
        failedToFetch = true;
      }
    }

    return {
      institutionId: params.id,
      valid: false,
      hoverLogo: false,
      draggingFile: false,
      defaultLogo,
      logoPreview: null,
      loading: false,
      institution,
      failedToFetch,
      selfInstitution: params.id === 'self',
    };
  },
  computed: {
    userRoles() {
      const roles = this.$auth?.user?.roles;
      return Array.isArray(roles) ? roles : [];
    },
    isAdmin() {
      return this.userRoles.some((role) => ['admin', 'superuser'].includes(role));
    },
    isMember() {
      if (!this.institution?.role) { return false; }

      const roles = new Set([this.institution.role, `${this.institution.role}_read_only`]);
      return this.userRoles.some((role) => roles.has(role));
    },
    isContact() {
      return this.isMember && this.userRoles.some((role) => ['doc_contact', 'tech_contact'].includes(role));
    },
    isCreator() {
      const creator = this.institution?.creator;
      return creator && (creator === this.$auth?.user?.username);
    },
    canEdit() {
      return this.isAdmin || this.isContact || this.isCreator;
    },
  },
  methods: {
    editInstitution() {
      if (this.institution) {
        this.$refs.institutionForm.editInstitution(this.institution);
      }
    },
    createInstitution() {
      this.$refs.institutionForm.createInstitution();
    },
    async refreshInstitution() {
      try {
        this.institution = await this.$axios.$get(`/institutions/${this.institutionId}`);
      } catch (e) {
        if (e.response?.status !== 404) {
          this.failedToFetch = true;
        }
      }
    },
  },
};
</script>
