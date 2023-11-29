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

        <v-btn text @click="deleteRepos">
          <v-icon left>
            mdi-delete
          </v-icon>
          {{ $t('delete') }}
        </v-btn>
      </template>

      <template v-else #default>
        <v-spacer />

        <!-- <v-btn text @click="createRepo">
          <v-icon left>
            mdi-plus
          </v-icon>
          {{ $t('add') }}
        </v-btn> -->

        <v-btn text :loading="refreshing" @click="refreshRepos">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>

        <v-btn
          text
          color="black"
          @click="showReposFiltersDrawer = true"
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
      :items="repos"
      :loading="refreshing"
      sort-by="pattern"
      item-key="pattern"
      show-select
      @pagination="currentItemCount = $event.itemsLength"
    >
      <template #[`item.institutions`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.institutions)"
          small
          class="elevation-1"
        >
          <!-- @click="$refs.institutionsDialog?.display?.(item)" -->
          {{ $tc('repositories.institutionsCount', item.institutions.length) }}

          <v-icon right small>
            mdi-domain
          </v-icon>
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
            <v-list-item @click="deleteRepo(item)">
              <v-list-item-icon>
                <v-icon>mdi-delete</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('delete') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <RepositoriesDeleteDialog ref="deleteDialog" @removed="onReposRemove" />
    <!-- <RepositoriesInstitutionsDialog ref="institutionsDialog" @updated="refreshRepos" /> -->
    <ReposFiltersDrawer
      v-model="filters"
      :show.sync="showReposFiltersDrawer"
      :search="search"
      :max-institutions-count="maxCounts.institutions"
    />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
// import RepositoriesInstitutionsDialog from '~/components/repositories/InstitutionsDialog.vue';
import RepositoriesDeleteDialog from '~/components/repositories/DeleteDialog.vue';
import ReposFiltersDrawer from '~/components/repositories/ReposFiltersDrawer.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    // RepositoriesInstitutionsDialog,
    ReposFiltersDrawer,
    RepositoriesDeleteDialog
  },
  data() {
    return {
      showReposFiltersDrawer: false,

      selected: [],
      search: '',
      refreshing: false,
      repos: [],
      filters: {},
      currentItemCount: 0,
    };
  },
  mounted() {
    return this.refreshRepos();
  },
  computed: {
    hasSelection() {
      return this.selected.length > 0;
    },
    toolbarTitle() {
      if (this.hasSelection) {
        return this.$t('nSelected', { count: this.selected.length });
      }

      let count = this.repos?.length;
      if (count != null && this.currentItemCount !== count) {
        count = `${this.currentItemCount}/${count}`;
      }

      return this.$t('repositories.toolbarTitle', { count: count ?? '?' });
    },
    tableHeaders() {
      return [
        {
          text: this.$t('repositories.pattern'),
          value: 'pattern',
          filter: (_value, _search, item) => this.columnStringFilter('pattern', item),
        },
        {
          text: this.$t('repositories.type'),
          value: 'type',
          filter: (_value, _search, item) => this.columnTypeFilter('type', item),
        },
        {
          text: this.$t('repositories.institutions'),
          value: 'institutions',
          filter: (_value, _search, item) => this.columnArrayFilter('institutions', item),
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
    /**
     * Compute maximum count of properties
     *
     * @returns {Record<string, number>}
     */
     maxCounts() {
      const counters = {
        institutions: 0,
      };

      // eslint-disable-next-line no-restricted-syntax
      for (const institution of this.repos) {
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
     * @param {string | undefined} value The item's value
     * @param {string | undefined} search The value searched
     */
    basicFilter(value, search) {
      return value?.toLowerCase()?.includes(search?.toLowerCase() ?? '');
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
      const filter = this.filters[field]?.value;
      if (!filter) {
        return true;
      }
      return this.basicFilter(value, filter);
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
      const range = this.filters?.[`${field}Range`]?.value;
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
        const isPattern = this.basicFilter(item.pattern, this.search);
        return isPattern;
      }
      return this.basicStringFilter(field, item[field]);
    },
    columnTypeFilter(field, item) {
      const filter = this.filters[field]?.value;
      if (!filter) {
        return true;
      }

      return item[field] === filter;
    },

    async refreshRepos() {
      this.refreshing = true;

      try {
        this.repos = await this.$axios.$get('/repositories', {
          params: {
            include: ['institutions'],
          },
        });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('repositories.repository'));
      }

      if (!Array.isArray(this.repos)) {
        this.repos = [];
      }

      this.refreshing = false;
    },

    // createRepo() {
    //   this.$refs.repoForm.createRepo({ addAsMember: false });
    // },
    deleteRepo(item) {
      this.$refs.deleteDialog.confirmDelete([item]);
    },
    deleteRepos() {
      this.$refs.deleteDialog.confirmDelete(this.selected);
    },
    onReposRemove(removedIds) {
      const removeDeleted = (repo) => !removedIds.some((id) => repo.id === id);
      this.repos = this.repos.filter(removeDeleted);
      this.selected = this.selected.filter(removeDeleted);
    },

    clearSelection() {
      this.selected = [];
    },
  },
};
</script>

<style lang="scss" scoped>

</style>
