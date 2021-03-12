<template>
  <section>
    <ToolBar :title="$t('institutions.members.title', { institutionName })" />

    <v-data-table
      v-if="hasInstitution"
      :headers="headers"
      :items="members"
      :loading="refreshing"
      item-key="email"
    >
      <template v-slot:item.correspondent="{ item }">
        <v-chip
          v-if="item.roles && item.roles.includes('tech_contact')"
          small
          label
          color="secondary"
          v-text="$t('institutions.members.technicalCorrespondent')"
        />
        <v-chip
          v-if="item.roles && item.roles.includes('doc_contact')"
          small
          label
          color="secondary"
          v-text="$t('institutions.members.documentaryCorrespondent')"
        />
      </template>

      <template v-slot:item.readonly="{ item }">
        <span v-if="item.readonly">
          {{ $t('institutions.members.read') }}
        </span>
        <span v-else>
          {{ $t('institutions.members.read') }} / {{ $t('institutions.members.write') }}
        </span>
      </template>
    </v-data-table>

    <v-card-text v-else>
      <div class="mb-2" v-text="$t('institutions.notAttachedToAnyInstitution')" />
      <a :href="'/info/institution'" v-text="$t('institutions.reportInstitutionInformation')" />
    </v-card-text>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
  },
  async asyncData({
    $axios,
    store,
    params,
    app,
    $auth,
    redirect,
  }) {
    let institution = null;

    if (!$auth.hasScope('superuser') && !$auth.hasScope('institution_form')) {
      return redirect({ name: 'myspace' });
    }

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
      valid: false,
      lazy: false,
      refreshing: false,
      institution,
      members: [],
      headers: [
        {
          text: app.i18n.t('institutions.members.name'),
          value: 'full_name',
        },
        {
          text: 'Email',
          value: 'email',
        },
        {
          text: app.i18n.t('institutions.members.permissions'),
          value: 'readonly',
        },
        {
          text: app.i18n.t('institutions.members.correspondent'),
          value: 'correspondent',
        },
      ],
    };
  },
  computed: {
    hasInstitution() {
      return !!this.institution?.id;
    },
    institutionName() {
      return this.institution?.name;
    },
  },
  mounted() {
    return this.refreshMembers();
  },
  methods: {
    async refreshMembers() {
      if (!this.hasInstitution) { return; }

      this.refreshing = true;

      try {
        this.members = await this.$axios.$get(`/institutions/${this.institution.id}/members`);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.members.unableToRetriveMembers'));
      }

      this.refreshing = false;
    },
  },
};
</script>
