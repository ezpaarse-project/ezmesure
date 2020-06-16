<template>
  <section>
    <ToolBar :title="`Membres - ${institution.name}`" />

    <v-data-table
      v-if="hasInstitution"
      :headers="headers"
      :items="members"
      :loading="refreshing"
      item-key="email"
    >
      <template v-slot:item.correspondent="{ item }">
        <v-chip v-if="item.type && item.type.includes('tech')" small label color="secondary">
          Technique
        </v-chip>
        <v-chip v-if="item.type && item.type.includes('doc')" small label color="secondary">
          Documentaire
        </v-chip>
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
      <div class="mb-2">
        Vous n'êtes rattachés à aucun établissement,
        où vous n'avez déclaré aucunes informations sur votre établissement.
      </div>
      <a :href="'/info/institution'">
        Déclarer des informations d'établissement.
      </a>
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
  async asyncData({ $axios, store, params }) {
    let institution = null;

    try {
      institution = await $axios.$get(`/institutions/${params.id}`);
    } catch (e) {
      if (e.response?.status === 404) {
        institution = {};
      } else {
        store.dispatch('snacks/error', 'Impossible de récupérer les informations d\'établissement');
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
          text: 'Name',
          value: 'fullName',
        },
        {
          text: 'Email',
          value: 'email',
        },
        {
          text: 'Correspondant',
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
        this.$store.dispatch('snacks/error', 'Impossible de récupérer les membres');
      }

      this.refreshing = false;
    },
  },
};
</script>
