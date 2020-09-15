<template>
  <section>
    <ToolBar :title="$t('institutions.members.title', { institutionName: institution.name })" />

    <v-data-table
      v-if="hasInstitution"
      :headers="headers"
      :items="members"
      :loading="refreshing"
      item-key="email"
    >
      <template v-slot:item.correspondent="{ item }">
        <v-chip
          v-if="item.type && item.type.includes('tech')"
          small
          label
          color="secondary"
          v-text="$t('institutions.members.technicalCorrespondent')"
        />
        <v-chip
          v-if="item.type && item.type.includes('doc')"
          small
          label
          color="secondary"
          v-text="$t('institutions.members.documentaryCorrespondent')"
        />
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          @click="editMember(item)"
        >
          mdi-pencil
        </v-icon>
      </template>
    </v-data-table>

    <v-card-text v-else>
      <div class="mb-2" v-text="$t('institutions.notAttachedToAnyInstitution')" />
      <a :href="'/info/institution'" v-text="$t('institutions.reportInstitutionInformation')" />
    </v-card-text>

    <MemberForm ref="memberForm" @update="refreshMembers" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';
import MemberForm from '~/components/MemberForm';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    MemberForm,
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
      valid: false,
      lazy: false,
      refreshing: false,
      institution,
      members: [],
      headers: [
        {
          text: app.i18n.t('institutions.members.name'),
          value: 'fullName',
        },
        {
          text: 'Email',
          value: 'email',
        },
        {
          text: app.i18n.t('institutions.members.correspondent'),
          value: 'correspondent',
        },
        {
          text: 'Actions',
          value: 'actions',
          sortable: false,
          width: '100px',
          align: 'right',
        },
      ],
    };
  },
  computed: {
    hasInstitution() {
      return !!this.institution?.id;
    },
  },
  mounted() {
    return this.refreshMembers();
  },
  methods: {
    editMember(item) {
      this.$refs.memberForm.editMember(this.institution.id, item);
    },
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
