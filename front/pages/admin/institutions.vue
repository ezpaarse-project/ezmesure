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

        <v-btn
          text
          color="black"
          @click="showInstitutionsFiltersDrawer = true"
        >
          <v-badge
            :value="filtersCount > 0"
            :content="filtersCount"
            overlap
            left
          >
            <v-icon>
              mdi-filter
            </v-icon>
          </v-badge>
          {{ $t('filter') }}
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
      :loading="refreshing"
      sort-by="name"
      item-key="id"
      show-select
      @current-items="currentItemCount = $event.length"
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
    <InstitutionsFiltersDrawer
      v-model="filters"
      :show.sync="showInstitutionsFiltersDrawer"
      :max-memberships-count="maxCounts.memberships"
      :max-child-institutions-count="maxCounts.childInstitutions"
      :max-repositories-count="maxCounts.repositories"
      :max-spaces-count="maxCounts.spaces"
    />
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
import InstitutionsFiltersDrawer from '~/components/institutions/InstitutionsFiltersDrawer.vue';

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
    InstitutionsFiltersDrawer,
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
      showInstitutionsFiltersDrawer: false,
      filters: {},
      currentItemCount: 0,
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

      let count = this.institutions?.length;
      if (count != null && this.currentItemCount !== count) {
        count = `${this.currentItemCount}/${count}`;
      }

      return this.$t('institutions.toolbarTitle', { count: count ?? '?' });
    },
    availableTableHeaders() {
      return [
        {
          text: this.$t('institutions.title'),
          value: 'name',
          filter: (_value, _search, item) => this.columnStringFilter('name', item),
        },
        {
          text: this.$t('institutions.institution.acronym'),
          value: 'acronym',
          filter: (_value, _search, item) => this.columnStringFilter('acronym', item),
        },
        {
          text: this.$t('institutions.institution.namespace'),
          value: 'namespace',
          filterable: false,
        },
        {
          text: this.$t('institutions.institution.members'),
          width: '150px',
          value: 'memberships',
          filter: (_value, _search, item) => this.columnArrayFilter('memberships', item),
        },
        {
          text: this.$t('subinstitutions.subinstitutions'),
          width: '170px',
          value: 'childInstitutions',
          filter: (_value, _search, item) => this.columnArrayFilter('childInstitutions', item),
        },
        {
          text: this.$t('repositories.repositories'),
          width: '150px',
          value: 'repositories',
          filter: (_value, _search, item) => this.columnArrayFilter('repositories', item),
        },
        {
          text: this.$t('spaces.spaces'),
          width: '150px',
          value: 'spaces',
          filter: (_value, _search, item) => this.columnArrayFilter('spaces', item),
        },
        {
          text: this.$t('institutions.institution.status'),
          value: 'status',
          width: '120px',
          filter: (value) => this.basicBoolFilter('status', value),
        },
        {
          text: this.$t('actions'),
          value: 'actions',
          filterable: false,
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
    filtersCount() {
      return Object.values(this.filters)
        .reduce(
          (prev, filter) => {
            // skipping if undefined or empty
            if (filter == null || filter === '') {
              return prev;
            }
            // skipping if empty array
            if (Array.isArray(filter) && filter.length <= 0) {
              return prev;
            }

            return prev + 1;
          },
          0,
        );
    },
    maxCounts() {
      const counters = {
        memberships: 0,
        childInstitutions: 0,
        repositories: 0,
        spaces: 0,
      };

      // eslint-disable-next-line no-restricted-syntax
      for (const institution of this.institutions) {
        // eslint-disable-next-line no-restricted-syntax
        for (const property of Object.keys(counters)) {
          if (Array.isArray(institution[property])) {
            counters[property] = Math.max(counters[property], institution[property].length);
          }
        }
      }

      return counters;
    },
  },
  methods: {
    /**
     * Basic filter applied by default to v-data-table
     *
     * @param {string} value The item's value
     * @param {string} search The value searched
     */
    basicFilter(value, search) {
      return value.toLowerCase().includes(search.toLowerCase());
    },
    /**
     * Basic filter applied to string fields using filter popups
     *
     * @param {string} field The filter's field
     * @param {string} value The item's value
     *
     * @return {boolean} If the item must be showed or not
     */
    basicStringFilter(field, value) {
      if (!this.filters[field]) {
        return true;
      }
      return this.basicFilter(value, this.filters[field]);
    },
    /**
     * Basic filter applied to bool fields using filter popups
     *
     * @param {string} field The filter's field
     * @param {boolean} value The item's value
     *
     * @return {boolean} If the item must be showed or not
     */
    basicBoolFilter(field, value) {
      if (this.filters[field] == null) {
        return true;
      }
      return this.filters[field] === value;
    },
    /**
     * Filter for array column using filters
     *
     * @param {string} field The filter's field
     * @param {*} item The item
     *
     * @return {boolean} If the item must be showed or not
     */
    columnArrayFilter(field, item) {
      const range = this.filters[field];
      if (range == null || !Array.isArray(item[field])) {
        return true;
      }

      const value = item[field].length;
      return range[0] <= value && value <= range[1];
    },
    /**
     * Filter for string column using search, fallbacks to filters
     *
     * @param {string} field The item's field
     * @param {*} item The item
     *
     * @return {boolean} If the item must be showed or not
     */
    columnStringFilter(field, item) {
      if (this.search) {
        const isName = this.basicFilter(item.name, this.search);
        const isAcronym = this.basicFilter(item.acronym, this.search);
        return isName || isAcronym;
      }
      return this.basicStringFilter(field, item[field]);
    },
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
