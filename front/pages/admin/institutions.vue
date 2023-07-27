<template>
  <section>
    <ToolBar
      :title="toolbarTitle"
      :dark="hasSelection"
    >
      <template v-if="hasSelection" #nav-icon>
        <v-btn icon @click="clearSelection">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <template v-if="hasSelection" #default>
        <v-spacer />

        <v-btn text @click="deleteInstitutions">
          <v-icon left>
            mdi-delete
          </v-icon>
          {{ $t('delete') }}
        </v-btn>
      </template>

      <template v-else #default>
        <v-spacer />

        <v-btn text @click="createInstitution">
          <v-icon left>
            mdi-plus
          </v-icon>
          {{ $t('add') }}
        </v-btn>
        <v-btn text :loading="refreshing" @click="refreshInstitutions">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>

        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          :label="$t('search')"
          solo
          dense
          hide-details
          style="max-width: 200px"
        />
      </template>
    </ToolBar>

    <v-data-table
      v-model="selected"
      :headers="tableHeaders"
      :items="institutions"
      :search="search"
      :loading="refreshing"
      sort-by="name"
      item-key="id"
      show-select
    >
      <template #top>
        <v-toolbar flat dense>
          <v-spacer />

          <DropdownSelector
            v-model="selectedTableHeaders"
            :items="availableTableHeaders"
            icon="mdi-table-eye"
          />
        </v-toolbar>
      </template>

      <template #[`item.name`]="{ item }">
        <nuxt-link :to="`/institutions/${item.id}`">
          {{ item.name }}
        </nuxt-link>
      </template>

      <template #[`item.childInstitutions`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.childInstitutions)"
          small
          class="elevation-1"
          @click="$refs.subInstitutionsDialog?.display?.(item)"
        >
          {{ $tc('subinstitutions.count', item.childInstitutions.length) }}

          <v-icon right small>
            mdi-family-tree
          </v-icon>
        </v-chip>
      </template>

      <template #[`item.memberships`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.memberships)"
          small
          class="elevation-1"
          :to="`/institutions/${item.id}/members`"
        >
          {{ $tc('institutions.institution.membersCount', item.memberships.length) }}

          <v-icon right small>
            mdi-account-multiple
          </v-icon>
        </v-chip>
      </template>

      <template #[`item.repositories`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.repositories)"
          small
          class="elevation-1"
          @click="$refs.repositoriesDialog.display(item)"
        >
          {{ $tc('repositories.xRepositories', item.repositories.length) }}

          <v-icon right small>
            mdi-cog
          </v-icon>
        </v-chip>
      </template>

      <template #[`item.spaces`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.spaces)"
          small
          class="elevation-1"
          @click="$refs.spacesDialog.display(item)"
        >
          {{ $tc('spaces.xSpaces', item.spaces.length) }}

          <v-icon right small>
            mdi-cog
          </v-icon>
        </v-chip>
      </template>

      <template #[`item.status`]="{ item }">
        <v-chip
          label
          small
          :color="item.validated ? 'success' : 'default'"
          outlined
        >
          {{
            item.validated
              ? $t('institutions.institution.validated')
              : $t('institutions.institution.notValidated')
          }}
        </v-chip>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>
                mdi-cog
              </v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item @click="editInstitution(item)">
              <v-list-item-icon>
                <v-icon>mdi-pencil</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('modify') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item :to="`/institutions/${item.id}/sushi`">
              <v-list-item-icon>
                <v-icon>mdi-key</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('institutions.sushi.credentials') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item :to="`/institutions/${item.id}/members`">
              <v-list-item-icon>
                <v-icon>mdi-account-multiple</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('institutions.members.members') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item :disabled="!item.validated" :to="`/admin/report/?institution=${item.id}`">
              <v-list-item-icon>
                <v-icon>mdi-file-chart-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('institutions.reports.reports') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item @click="copyInstitutionId(item)">
              <v-list-item-icon>
                <v-icon>mdi-identifier</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('copyId') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <InstitutionForm ref="institutionForm" @update="refreshInstitutions" />
    <InstitutionsDeleteDialog ref="deleteDialog" @removed="onInstitutionsRemove" />
    <RepositoriesDialog ref="repositoriesDialog" />
    <SpacesDialog ref="spacesDialog" @updated="refreshInstitutions" />
    <SubInstitutionsDialog ref="subInstitutionsDialog" @updated="refreshInstitutions" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import DropdownSelector from '~/components/DropdownSelector.vue';
import InstitutionForm from '~/components/InstitutionForm.vue';
import InstitutionsDeleteDialog from '~/components/InstitutionsDeleteDialog.vue';
import RepositoriesDialog from '~/components/RepositoriesDialog.vue';
import SpacesDialog from '~/components/SpacesDialog.vue';
import SubInstitutionsDialog from '~/components/SubInstitutionsDialog.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    DropdownSelector,
    InstitutionForm,
    InstitutionsDeleteDialog,
    RepositoriesDialog,
    SpacesDialog,
    SubInstitutionsDialog,
  },
  data() {
    return {
      selected: [],
      search: '',
      refreshing: false,
      types: ['tech', 'doc'],
      logo: null,
      logoPreview: null,
      institutions: [],
      selectedTableHeaders: [
        'name',
        'acronym',
        'namespace',
        'memberships',
        'childInstitutions',
        'repositories',
        'spaces',
        'status',
        'actions',
      ],
    };
  },
  mounted() {
    return this.refreshInstitutions();
  },
  computed: {
    hasSelection() {
      return this.selected.length > 0;
    },
    toolbarTitle() {
      if (this.hasSelection) {
        return this.$t('nSelected', { count: this.selected.length });
      }
      return this.$t('institutions.toolbarTitle', { count: this.institutions?.length ?? '?' });
    },
    availableTableHeaders() {
      return [
        { text: this.$t('institutions.title'), value: 'name' },
        { text: this.$t('institutions.institution.acronym'), value: 'acronym' },
        { text: this.$t('institutions.institution.namespace'), value: 'namespace' },
        {
          text: this.$t('institutions.institution.members'),
          width: '150px',
          value: 'memberships',
        },
        {
          text: this.$t('subinstitutions.subinstitutions'),
          width: '170px',
          value: 'childInstitutions',
        },
        {
          text: this.$t('repositories.repositories'),
          width: '150px',
          value: 'repositories',
        },
        {
          text: this.$t('spaces.spaces'),
          width: '150px',
          value: 'spaces',
        },
        {
          text: this.$t('institutions.institution.status'),
          value: 'status',
          width: '120px',
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
    tableHeaders() {
      return this.availableTableHeaders.filter((header) => (
        this.selectedTableHeaders?.includes?.(header?.value)
      ));
    },
  },
  methods: {
    async refreshInstitutions() {
      this.refreshing = true;

      try {
        this.institutions = await this.$axios.$get('/institutions', {
          params: {
            include: ['repositories', 'memberships', 'spaces', 'childInstitutions'],
          },
        });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.unableToRetriveInformations'));
      }

      if (!Array.isArray(this.institutions)) {
        this.institutions = [];
      }

      this.refreshing = false;
    },
    editInstitution(item) {
      this.$refs.institutionForm.editInstitution(item);
    },
    createInstitution() {
      this.$refs.institutionForm.createInstitution({ addAsMember: false });
    },
    onInstitutionsRemove(removedIds) {
      const removeDeleted = (institution) => !removedIds.some((id) => institution.id === id);
      this.institutions = this.institutions.filter(removeDeleted);
      this.selected = this.selected.filter(removeDeleted);
    },
    async copyInstitutionId(item) {
      if (!navigator.clipboard) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      try {
        await navigator.clipboard.writeText(item.id);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      this.$store.dispatch('snacks/info', this.$t('idCopied'));
    },
    deleteInstitutions() {
      this.$refs.deleteDialog.confirmDelete(this.selected);
    },
    clearSelection() {
      this.selected = [];
    },
  },
};
</script>
