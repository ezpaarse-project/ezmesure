<template>
  <section>
    <ToolBar :title="institution?.name">
      <v-spacer />

      <v-btn
        v-if="canReadSushi"
        color="primary"
        text
        :to="`/institutions/${institutionId}/sushi`"
      >
        <v-icon left>
          mdi-key
        </v-icon>
        {{ $t('institutions.sushi.credentials') }}
      </v-btn>

      <v-btn
        v-if="canReadMembers"
        color="primary"
        text
        :to="`/institutions/${institutionId}/members`"
      >
        <v-icon left>
          mdi-account-multiple
        </v-icon>
        {{ $t('institutions.members.members') }}
      </v-btn>

      <v-btn
        v-if="canEditInstitution"
        color="primary"
        text
        @click="editInstitution"
      >
        <v-icon left>
          mdi-pencil
        </v-icon>
        {{ $t('modify') }}
      </v-btn>
    </ToolBar>

    <v-card-text v-if="institution">
      <v-container style="max-width: 1400px;">
        <v-row>
          <v-col cols="12" md="6" lg="5">
            <InstitutionCard :institution="institution" />
          </v-col>
          <v-col cols="12" md="6" lg="7">
            <v-card>
              <ParentManager
                :parent-id="institution?.parentInstitutionId"
                :institution-id="institution?.id"
                flat
                @change="hasChanged = true"
              />
              <v-divider />
              <SubInstitutionsManager
                :institution-id="institution?.id"
                flat
                @change="hasChanged = true"
              />
              <v-divider />
              <RepositoriesManager
                :institution-id="institution?.id"
                flat
                @change="hasChanged = true"
              />
              <v-divider />
              <SpacesManager
                :institution-id="institution?.id"
                flat
                @change="hasChanged = true"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-text v-else-if="failedToFetch">
      <v-alert
        type="error"
        :value="true"
      >
        {{ $t('institutions.unableToRetriveInformations') }}
      </v-alert>
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
import ParentManager from '~/components/ParentManager.vue';
import SubInstitutionsManager from '~/components/SubInstitutionsManager.vue';
import RepositoriesManager from '~/components/RepositoriesManager.vue';
import SpacesManager from '~/components/SpacesManager.vue';

const defaultLogo = require('@/static/images/logo-etab.png');

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    InstitutionForm,
    InstitutionCard,
    ParentManager,
    SubInstitutionsManager,
    RepositoriesManager,
    SpacesManager,
  },
  async asyncData({
    $axios,
    params,
  }) {
    let institution = null;
    let failedToFetch = false;

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
    };
  },
  computed: {
    userRoles() {
      const roles = this.$auth?.user?.roles;
      return Array.isArray(roles) ? roles : [];
    },
    isAdmin() {
      return this.$auth?.user?.isAdmin;
    },
    membership() {
      return this.$auth?.user?.memberships?.find((m) => (m.institutionId === this.institution?.id));
    },
    isMember() {
      return !!this.membership;
    },
    permissions() {
      return new Set(this.membership?.permissions || []);
    },
    canEditInstitution() {
      return this.isAdmin || this.permissions.has('institution:write');
    },
    canReadSushi() {
      return this.isAdmin || this.permissions.has('sushi:read');
    },
    canReadMembers() {
      return this.isAdmin || this.permissions.has('memberships:read');
    },
  },
  methods: {
    editInstitution() {
      if (this.institution) {
        this.$refs.institutionForm.editInstitution(this.institution);
      }
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
