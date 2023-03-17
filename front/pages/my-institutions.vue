<template>
  <section>
    <ToolBar :title="toolbarTitle">
      <v-spacer />

      <v-btn text :loading="refreshing" @click="refreshMemberships">
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>
    </ToolBar>

    <v-container>
      <v-row>
        <v-col
          v-for="membership in memberships"
          :key="membership.id"
          cols="12"
          sm="6"
          xl="3"
        >
          <InstitutionCard
            :institution="membership.institution"
            style="height: 100%;"
          >
            <template
              v-if="membership.isDocContact || membership.isTechContact"
              #menu
            >
              <v-menu left bottom>
                <template #activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    small
                    text
                    v-bind="attrs"
                    v-on="on"
                  >
                    {{ $t('actions') }}
                    <v-icon right>
                      mdi-menu-down
                    </v-icon>
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item @click="editInstitution(membership.institution)">
                    <v-list-item-icon>
                      <v-icon>mdi-pencil</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ $t('modify') }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item
                    :disabled="!membership.institution.validated"
                    :to="`/institutions/${membership.institution.id}/sushi`"
                  >
                    <v-list-item-icon>
                      <v-icon>mdi-key</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ $t('institutions.sushi.credentials') }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item
                    :disabled="!membership.institution.validated"
                    :to="`/institutions/${membership.institution.id}/members`"
                  >
                    <v-list-item-icon>
                      <v-icon>mdi-account-multiple</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ $t('institutions.members.members') }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </InstitutionCard>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          xl="3"
        >
          <v-card
            outlined
            class="d-flex align-center justify-center grey lighten-4"
            style="height: 100%; min-height: 250px;"
          >
            <v-card-text class="text-center">
              <v-btn large fab depressed outlined @click="createInstitution">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
              <p class="mt-3 font-weight-medium">
                {{ $t('institutions.declareNewInstitution') }}
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <InstitutionForm ref="institutionForm" @update="refreshMemberships" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import InstitutionForm from '~/components/InstitutionForm.vue';
import InstitutionCard from '~/components/InstitutionCard.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    InstitutionForm,
    InstitutionCard,
  },
  data() {
    return {
      refreshing: false,
      types: ['tech', 'doc'],
      logo: null,
      logoPreview: null,
      memberships: [],
    };
  },
  mounted() {
    return this.refreshMemberships();
  },
  computed: {
    toolbarTitle() {
      return this.$t('menu.myInstitutions');
    },
    headers() {
      return [
        { text: this.$t('institutions.title'), value: 'institution.name' },
        { text: this.$t('institutions.institution.acronym'), value: 'institution.acronym' },
        {
          text: this.$t('institutions.institution.status'),
          value: 'status',
          width: '150px',
        },
        {
          text: this.$t('actions'),
          value: 'actions',
          sortable: false,
          width: '85px',
          align: 'center',
        },
      ];
    },
  },
  methods: {
    async refreshMemberships() {
      this.refreshing = true;

      try {
        this.memberships = await this.$axios.$get('/profile/memberships');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.unableToRetriveInformations'));
      }

      if (!Array.isArray(this.memberships)) {
        this.memberships = [];
      }

      this.refreshing = false;
    },
    editInstitution(item) {
      this.$refs.institutionForm.editInstitution(item);
    },
    createInstitution() {
      this.$refs.institutionForm.createInstitution({ addAsMember: true });
    },
  },
};
</script>
