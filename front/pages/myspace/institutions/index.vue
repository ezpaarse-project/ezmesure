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

    <v-container cols="12" sm="12">
      <v-row>
        <v-col>
          <v-autocomplete
            :search-input.sync="searchValue"
            class="ma-4"
            item-text="name"
            :items="institutions"
            :hide-no-data="!searchValue"
            :label="$t('institutions.askToJoinAnInstitution')"
            :loading="loading"
            solo
            dense
            clearable
          >
            <template slot="no-data">
              <v-list-item link @click.stop="createInstitution">
                <v-list-item-content>
                  <v-list-item-title>
                    {{ $t('institutions.institutionFoundDeclareNewInstitution') }}
                  </v-list-item-title>
                </v-list-item-content>
                <v-list-item-icon>
                  <v-icon> mdi-plus</v-icon>
                </v-list-item-icon>
              </v-list-item>
            </template>

            <template #item="{ item }">
              <v-list-item link @click.stop="openJoinInstitutionDialog(item)">
                <v-list-item-content>
                  <v-list-item-title>
                    {{ item.name }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-autocomplete>
          <JoinInstitutionDialog
            v-model="joinInstitutionDialogVisible"
            :institution="institutionSelected"
          />
        </v-col>
      </v-row>
    </v-container>
    <v-container>
      <v-row>
        <v-col
          v-for="membership in memberships"
          :key="membership.id"
          cols="12"
          md="6"
          xl="4"
        >
          <InstitutionCard
            :institution="membership.institution"
            :membership="membership"
            style="height: 100%;"
          >
            <template
              #menu="{ permissions, validated }"
            >
              <v-divider v-if="permissions.size > 0" />
              <v-list v-if="permissions.size > 0" dense color="grey lighten-5">
                <v-list-item
                  :disabled="!permissions.has('institution:write')"
                  @click="editInstitution(membership.institution)"
                >
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
                  :disabled="!validated || !permissions.has('sushi:read')"
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
                  :disabled="!validated || !permissions.has('memberships:read')"
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

                <v-list-item
                  :disabled="!validated || !permissions.has('reporting:read')"
                  :to="`/institutions/${membership.institution.id}/reports`"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-file-chart-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ $t('institutions.reports.reports') }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </template>
          </InstitutionCard>
        </v-col>
      </v-row>
    </v-container>

    <v-container>
      <v-row v-if="memberships?.length === 0" align="center" justify="center">
        <v-col class="text-center" cols="12">
          <v-icon x-large>
            mdi-alert-box
          </v-icon>
        </v-col>
        <v-col class="text-center" cols="12">
          {{ $t('institutions.noInstitutions') }}
        </v-col>
      </v-row>
    </v-container>

    <InstitutionForm ref="institutionForm" @update="refreshMemberships" />
  </section>
</template>

<script>
import debounce from 'lodash.debounce';

import ToolBar from '~/components/space/ToolBar.vue';
import InstitutionForm from '~/components/InstitutionForm.vue';
import InstitutionCard from '~/components/InstitutionCard.vue';
import JoinInstitutionDialog from '~/components/institutions/JoinInstitutionDialog.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    InstitutionForm,
    InstitutionCard,
    JoinInstitutionDialog,
  },
  data() {
    return {
      refreshing: false,
      types: ['tech', 'doc'],
      logo: null,
      logoPreview: null,
      memberships: [],
      searchValue: '',
      institutions: [],
      institutionSelected: {},
      joinInstitutionDialogVisible: false,
      loading: false,
    };
  },
  async mounted() {
    this.refreshMemberships();
  },
  computed: {
    toolbarTitle() {
      return this.$t('menu.myInstitutions');
    },
  },
  methods: {
    getInstitution: debounce(async function getInstitution() {
      try {
        this.loading = true;
        this.institutions = await this.$axios.$get('/institutions', { params: { q: this.searchValue, size: 10 } });
        const listOfInstitutionID = this.memberships.map((membership) => membership.institutionId);
        this.institutions = this.institutions.filter(
          (institution) => !listOfInstitutionID.includes(institution.id),
        );
      } catch (err) {
        this.$store.dispatch('snacks/error', this.$t('institutions.unableToRetriveInformations'));
      }
      this.loading = false;
    }, 500),
    openJoinInstitutionDialog(institution) {
      this.institutionSelected = institution;
      this.joinInstitutionDialogVisible = true;
    },
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
  watch: {
    searchValue(newValue) {
      if (newValue) {
        this.getInstitution();
      }
    },
  },
};
</script>
