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

        <v-btn text @click="deleteInstitutions()">
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
      @pagination="currentItemCount = $event.itemsLength"
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
        <nuxt-link :to="`/admin/institutions/${item.id}`">
          {{ item.name }}
        </nuxt-link>
      </template>

      <template #[`item.childInstitutions`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.childInstitutions)"
          :outlined="item.childInstitutions?.length <= 0"
          small
          class="elevation-1"
          @click="$refs.subInstitutionsDialog?.display?.(item)"
        >
          {{ $tc('components.count', item.childInstitutions.length) }}

          <v-icon right small>
            mdi-family-tree
          </v-icon>
        </v-chip>
      </template>

      <template #[`item.memberships`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.memberships)"
          :outlined="item.memberships?.length <= 0"
          small
          class="elevation-1"
          :to="`/admin/institutions/${item.id}/members`"
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
          :outlined="item.repositories?.length <= 0"
          small
          class="elevation-1"
          @click="$refs.repositoriesDialog.display(item)"
        >
          {{ $tc('repositories.xRepositories', item.repositories.length) }}

          <v-icon right small>
            mdi-tray-arrow-down
          </v-icon>
        </v-chip>
      </template>

      <template #[`item.spaces`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.spaces)"
          :outlined="item.spaces?.length <= 0"
          small
          class="elevation-1"
          @click="$refs.spacesDialog.display(item)"
        >
          {{ $tc('spaces.xSpaces', item.spaces.length) }}

          <v-icon right small>
            mdi-tab
          </v-icon>
        </v-chip>
      </template>

      <template #[`item.status`]="{ item }">
        <ConfirmPopover
          :message="$t('areYouSure')"
          :agree-text="$t('confirm')"
          bottom
          right
          offset-y
          @agree="toggleValidationOfInstitution(item)"
        >
          <template #activator="{ on, attrs }">
            <v-switch
              :input-value="item.validated"
              :label="item.validated
                ? $t('institutions.institution.validated')
                : $t('institutions.institution.notValidated')"
              :loading="loadingMap[item.id]"
              readonly
              hide-details
              role="switch"
              class="mt-0"
              dense
              style="transform: scale(0.8);"
              v-bind="attrs"
              v-on="on"
            />
          </template>
        </ConfirmPopover>
      </template>

      <template #[`item.monitor`]="{ item }">
        <template v-for="icon in (servicesIconMap.get(item.id) ?? [])">
          <v-divider v-if="icon.spacer" :key="icon.key" vertical class="mx-1" />

          <v-tooltip
            v-else
            :key="icon.key"
            top
          >
            <template #activator="{ attrs, on }">
              <v-icon
                :color="icon.color"
                small
                v-bind="attrs"
                v-on="on"
              >
                {{ icon.icon }}
              </v-icon>
            </template>

            {{ icon.label }}
          </v-tooltip>
        </template>
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

            <v-list-item @click="deleteInstitutions([item])">
              <v-list-item-icon>
                <v-icon>mdi-delete</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('delete') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-divider />

            <v-list-item :to="`/admin/institutions/${item.id}/sushi`">
              <v-list-item-icon>
                <v-icon>mdi-key</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('institutions.sushi.credentials') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item :to="`/admin/institutions/${item.id}/members`">
              <v-list-item-icon>
                <v-icon>mdi-account-multiple</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('institutions.members.members') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item :disabled="!item.validated" :to="`/admin/institutions/${item.id}/reports`">
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

    <ConfirmDialog ref="confirmDialog" />
    <InstitutionForm ref="institutionForm" @update="refreshInstitutions" />
    <RepositoriesDialog ref="repositoriesDialog" @updated="refreshInstitutions" />
    <SpacesDialog ref="spacesDialog" @updated="refreshInstitutions" />
    <SubInstitutionsDialog ref="subInstitutionsDialog" @updated="refreshInstitutions" />
    <InstitutionsFiltersDrawer
      v-model="filters"
      :show.sync="showInstitutionsFiltersDrawer"
      :search="search"
      :selected-table-headers="selectedTableHeaders"
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
import RepositoriesDialog from '~/components/RepositoriesDialog.vue';
import SpacesDialog from '~/components/SpacesDialog.vue';
import SubInstitutionsDialog from '~/components/SubInstitutionsDialog.vue';
import InstitutionsFiltersDrawer from '~/components/institutions/InstitutionsFiltersDrawer.vue';
import ConfirmPopover from '~/components/ConfirmPopover.vue';
import ConfirmDialog from '~/components/ConfirmDialog.vue';

const iconDefMap = new Map([
  [
    'doc',
    {
      color: 'green',
      i18n: 'partners.documentary',
      icon: 'mdi-book',
    },
  ],
  [
    'tech',
    {
      color: 'blue',
      i18n: 'partners.technical',
      icon: 'mdi-wrench',
    },
  ],
  [
    'ezpaarse',
    {
      color: 'teal',
      i18n: 'partners.auto.ezpaarse',
    },
  ],
  [
    'counter5',
    {
      color: 'red',
      i18n: 'partners.auto.ezcounter',
    },
  ],
]);

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    DropdownSelector,
    InstitutionForm,
    RepositoriesDialog,
    SpacesDialog,
    SubInstitutionsDialog,
    InstitutionsFiltersDrawer,
    ConfirmPopover,
    ConfirmDialog,
  },
  data() {
    return {
      selected: [],
      search: '',
      refreshing: false,
      membershipsTypes: ['tech', 'doc'],
      logo: null,
      logoPreview: null,
      institutions: [],
      loadingMap: {},
      selectedTableHeaders: [
        'name',
        'acronym',
        'memberships',
        'childInstitutions',
        'repositories',
        'spaces',
        'status',
        'actions',
      ],
      showInstitutionsFiltersDrawer: false,
      filters: {
        name: { value: undefined },

        acronym: { value: undefined },

        membershipsRange: { value: undefined },

        childInstitutions: { value: undefined },
        childInstitutionsRange: { value: undefined },

        contacts: { value: undefined, exclusive: false },

        repositories: { value: undefined, exclusive: false },
        repositoriesRange: { value: undefined },

        spaces: { value: undefined, exclusive: false },
        spacesRange: { value: undefined },

        validated: { value: undefined },
      },
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
          align: 'center',
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
          align: 'center',
          filter: (_value, _search, item) => this.columnArrayFilter('memberships', item),
        },
        {
          text: this.$t('components.components'),
          width: '170px',
          value: 'childInstitutions',
          align: 'center',
          filter: (_value, _search, item) => this.columnArrayFilter('childInstitutions', item),
        },
        {
          text: this.$t('repositories.repositories'),
          width: '150px',
          value: 'repositories',
          align: 'center',
          filter: (_value, _search, item) => this.columnArrayFilter('repositories', item),
        },
        {
          text: this.$t('spaces.spaces'),
          width: '150px',
          value: 'spaces',
          align: 'center',
          filter: (_value, _search, item) => this.columnArrayFilter('spaces', item),
        },
        {
          text: this.$t('institutions.institution.status'),
          value: 'status',
          width: '120px',
          align: 'center',
          filter: (_value, _search, item) => this.basicBoolFilter('validated', item.validated),
        },
        {
          text: this.$t('institutions.institution.monitor'),
          value: 'monitor',
          align: 'center',
          sortable: false,
          filter: (_value, _search, item) => this.columnServiceFilter(item),
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
    /**
     * Get the count of filters with value
     *
     * @returns {number} The count of active filters
     */
    filtersCount() {
      return Object.values(this.filters)
        .reduce(
          (prev, filterDesc) => {
            const filter = filterDesc?.value;
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
    /**
     * Compute icons used to monitor quickly institution
     *
     * @returns {Object[]} Icon definitions
     */
    servicesIconMap() {
      if (!this.institutions) {
        return new Map();
      }

      const entries = this.institutions.map(
        (i) => {
          const services = new Set();

          return [
            i.id,
            [
              // search for contacts
              ...i.memberships.map(
                ({ roles }) => {
                  const icons = [];
                  const roleSet = new Set(roles);

                  // eslint-disable-next-line no-restricted-syntax
                  for (const roleSuffix of this.membershipsTypes) {
                    const def = iconDefMap.get(roleSuffix);
                    const role = `contact:${roleSuffix}`;

                    // skip if no chip definition, or if already found or if member doesnt have role
                    if (!def || services.has(role) || !roleSet.has(role)) {
                      // eslint-disable-next-line no-continue
                      continue;
                    }

                    services.add(role);
                    icons.push({
                      key: role,
                      icon: def.icon,
                      color: def.color,
                      label: this.$t(def.i18n),
                    });
                  }

                  return icons;
                },
              ),

              // search for repositories
              ...i.repositories.map(
                ({ type }) => {
                  const def = iconDefMap.get(type);

                  // skip if no chip definition, or if already found or if member doesnt have role
                  if (!def || services.has(`repository:${type}`)) {
                    // eslint-disable-next-line no-continue
                    return [];
                  }

                  services.add(`repository:${type}`);
                  return [
                    {
                      key: `repository:${type}`,
                      icon: 'mdi-tray-arrow-down',
                      color: def.color,
                      label: this.$t(def.i18n),
                    },
                  ];
                },
              ),

              // search for spaces
              ...i.spaces.map(
                ({ type }) => {
                  const def = iconDefMap.get(type);

                  // skip if no chip definition, or if already found or if member doesnt have role
                  if (!def || services.has(`space:${type}`)) {
                    // eslint-disable-next-line no-continue
                    return [];
                  }

                  services.add(`space:${type}`);
                  return [
                    {
                      key: `space:${type}`,
                      icon: 'mdi-tab',
                      color: def.color,
                      label: this.$t(def.i18n),
                    },
                  ];
                },
              ),
            ].flat(),
          ];
        },
      );

      return new Map(entries);
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
     * Basic filter applied to bool fields using filter popups
     *
     * @param {string} field The filter's field
     * @param {boolean} value The item's value
     *
     * @return {boolean} If the item must be showed or not
     */
    basicBoolFilter(field, value) {
      const filter = this.filters[field]?.value;
      if (filter == null) {
        return true;
      }
      return filter === value;
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
      const rangeField = `${field}Range`;
      const range = this.filters?.[rangeField]?.value;
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
    /**
     * Filter for service column
     *
     * @param {*} item The item
     *
     * @return {boolean} If the item must be showed or not
     */
    columnServiceFilter(item) {
      if (
        !this.filters.contacts?.value
        && !this.filters.repositories?.value
        && !this.filters.spaces?.value
      ) {
        return true;
      }

      const icons = this.servicesIconMap.get(item.id);
      if (!icons) {
        return false;
      }

      const services = icons.map((i) => i.key);

      let res = true;
      if (res && (this.filters.contacts?.value?.length ?? 0) > 0) {
        res = this.serviceContactsFilter(services);
      }

      if (res && (this.filters.repositories?.value?.length ?? 0) > 0) {
        res = this.serviceReposFilter(services);
      }

      if (res && (this.filters.spaces?.value?.length ?? 0) > 0) {
        res = this.serviceSpacesFilter(services);
      }

      return res;
    },
    /**
     * Apply contacts filters to given services
     *
     * @param {*} services The item's service
     *
     * @return {boolean} Should item be shown
     */
    serviceContactsFilter(services) {
      const contactsServices = services?.filter((s) => /^contact:/i.test(s)) ?? [];
      const contactsFilters = new Set(this.filters.contacts?.value);

      if (contactsFilters.has('contact:')) {
        return contactsServices.length === 0;
      }
      if (contactsServices.length === 0) {
        return false;
      }

      if (this.filters.contacts?.exclusive) {
        const servicesSet = new Set(contactsServices);

        return contactsFilters.size === servicesSet.size
          && [...contactsFilters].every((s) => servicesSet.has(s));
      }

      return contactsServices.some((s) => contactsFilters.has(s));
    },
    /**
     * Apply repos filters to given services
     *
     * @param {*} services The item's service
     *
     * @return {boolean} Should item be shown
     */
    serviceReposFilter(services) {
      const repositoriesServices = services?.filter((s) => /^repository:/i.test(s)) ?? [];
      const contactFilters = new Set(this.filters.repositories?.value);

      if (repositoriesServices.length === 0) {
        return false;
      }

      if (this.filters.repositories?.exclusive) {
        const servicesSet = new Set(repositoriesServices);

        return contactFilters.size === servicesSet.size
          && [...contactFilters].every((s) => servicesSet.has(s));
      }

      return repositoriesServices.some((s) => contactFilters.has(s));
    },

    /**
     * Apply spaces filters to given services
     *
     * @param {*} services The item's service
     *
     * @return {boolean} Should item be shown
     */
    serviceSpacesFilter(services) {
      const spacesServices = services?.filter((s) => /^space:/i.test(s)) ?? [];
      const spacesFilters = new Set(this.filters.spaces?.value);

      if (spacesServices.length === 0) {
        return false;
      }

      if (this.filters.spaces?.exclusive) {
        const servicesSet = new Set(spacesServices);

        return spacesFilters.size === servicesSet.size
          && [...spacesFilters].every((s) => servicesSet.has(s));
      }

      return spacesServices.some((s) => spacesFilters.has(s));
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
      this.loadingMap = {};
    },

    async toggleValidationOfInstitution(item) {
      this.loadingMap = { ...this.loadingMap, [item.id]: true };

      const value = !item.validated;
      await this.$axios.$put(
        `/institutions/${item.id}/validated`,
        { value },
      );

      const index = this.institutions.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        this.institutions.splice(index, 1, { ...item, validated: value });
      }

      this.loadingMap = { ...this.loadingMap, [item.id]: false };
    },

    editInstitution(item) {
      this.$refs.institutionForm.editInstitution(item);
    },
    createInstitution() {
      this.$refs.institutionForm.createInstitution({ addAsMember: false });
    },
    async deleteInstitutions(items) {
      const institutions = items || this.selected;
      if (institutions.length === 0) {
        return;
      }

      const confirmed = await this.$refs.confirmDialog?.open({
        title: this.$t('areYouSure'),
        message: this.$tc(
          'institutions.deleteNbInstitutions.text',
          institutions.length,
          { affected: this.$t('institutions.deleteNbInstitutions.affected') },
        ),
        agreeText: this.$t('delete'),
        agreeIcon: 'mdi-delete',
      });

      if (!confirmed) {
        return;
      }

      this.removing = true;

      const requests = institutions.map(async (item) => {
        let deleted = false;
        try {
          await this.$axios.$delete(`/institutions/${item.id}`);
          deleted = true;
        } catch (e) {
          deleted = false;
        }
        return { item, deleted };
      });

      const results = await Promise.all(requests);

      const { deleted, failed } = results.reduce((acc, result) => {
        const { item } = result;

        if (result.deleted) {
          acc.deleted.push(item);
        } else {
          this.$store.dispatch('snacks/error', this.$t('cannotDeleteItem', { id: item.name || item.id }));
          acc.failed.push(item);
        }
        return acc;
      }, { deleted: [], failed: [] });

      if (failed.length > 0) {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItems', { count: failed.length }));
      }
      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', this.$t('itemsDeleted', { count: deleted.length }));
      }

      this.removing = false;
      this.show = false;
      const removedIds = deleted.map((d) => d.id);

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

    clearSelection() {
      this.selected = [];
    },
  },
};
</script>
