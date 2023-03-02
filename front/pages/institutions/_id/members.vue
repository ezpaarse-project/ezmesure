<template>
  <section>
    <ToolBar :title="institutionName">
      <v-spacer />

      <v-btn text :loading="refreshing" @click="refreshMembers">
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>

      <MemberSearch
        :institution-id="institutionId"
        @added="refreshMembers"
      />
    </ToolBar>

    <v-data-table
      v-if="hasInstitution"
      :headers="headers"
      :items="members"
      :loading="refreshing"
      sort-by="fullName"
      item-key="username"
    >
      <template v-slot:top="{ originalItemsLength }">
        <v-toolbar flat>
          <v-toolbar-title>
            {{ $t('institutions.members.title', { total: originalItemsLength }) }}
          </v-toolbar-title>
        </v-toolbar>
      </template>

      <template v-slot:item.correspondent="{ item }">
        <v-chip
          v-if="item.isTechContact"
          small
          label
          color="secondary"
          v-text="$t('institutions.members.technical')"
        />
        <v-chip
          v-if="item.isDocContact"
          small
          label
          color="secondary"
          v-text="$t('institutions.members.documentary')"
        />
        <v-chip
          v-if="item.creator"
          small
          label
          color="secondary"
          outlined
          v-text="$t('institutions.members.creator')"
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

      <template v-slot:item.actions="{ item }">
        <MemberActions
          :member="item"
          @permissions="updateMember(item)"
          @delete="removeMember(item)"
        />
      </template>
    </v-data-table>

    <v-card-text v-else>
      <div class="mb-2" v-text="$t('institutions.notAttachedToAnyInstitution')" />
      <a :href="'/info/institution'" v-text="$t('institutions.reportInstitutionInformation')" />
    </v-card-text>

    <MemberUpdateDialog
      ref="updateDialog"
      :institution-id="institutionId"
      @updated="refreshMembers"
    />
    <MemberDeleteDialog
      ref="deleteDialog"
      :institution-id="institutionId"
      @removed="refreshMembers"
    />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';
import MemberActions from '~/components/MemberActions';
import MemberSearch from '~/components/MemberSearch';
import MemberDeleteDialog from '~/components/MemberDeleteDialog';
import MemberUpdateDialog from '~/components/MemberUpdateDialog';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    MemberActions,
    MemberSearch,
    MemberDeleteDialog,
    MemberUpdateDialog,
  },
  async asyncData({
    $axios,
    store,
    params,
    app,
    // $auth,
    // redirect,
  }) {
    let institution = null;

    // if (!$auth.hasScope('superuser') && !$auth.hasScope('institution_form')) {
    //   return redirect({ name: 'myspace' });
    // }

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
          value: 'user.fullName',
        },
        {
          text: app.i18n.t('institutions.members.username'),
          value: 'username',
        },
        {
          text: app.i18n.t('institutions.members.permissions'),
          value: 'readonly',
        },
        {
          text: app.i18n.t('institutions.members.correspondent'),
          value: 'correspondent',
        },
        {
          text: app.i18n.t('actions'),
          value: 'actions',
          sortable: false,
          width: '85px',
          align: 'center',
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
    institutionId() {
      return this.institution?.id;
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
        this.members = await this.$axios.$get(`/institutions/${this.institution.id}/memberships`);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.members.unableToRetriveMembers'));
      }

      this.refreshing = false;
    },

    updateMember(member) {
      this.$refs.updateDialog.updateMember(member);
    },
    removeMember(member) {
      this.$refs.deleteDialog.confirmRemove(member);
    },
  },
};
</script>
