<template>
  <section>
    <ToolBar :title="toolbarTitle">
      <v-spacer />

      <v-btn
        text
        @click.stop="createEndpoint"
      >
        <v-icon left>
          mdi-plus
        </v-icon>
        {{ $t('add') }}
      </v-btn>

      <v-btn
        :loading="refreshing"
        text
        @click.stop="refreshSushiEndpoints"
      >
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>

      <v-btn
        text
        color="black"
        @click="showEndpointFiltersDrawer = true"
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
        autocomplete="off"
        style="max-width: 200px"
      />
    </ToolBar>

    <v-container fluid>
      <div>{{ $t('endpoints.pageDescription') }}</div>
      <div><strong>{{ $t('endpoints.pageDescription2') }}</strong></div>
    </v-container>

    <EndpointForm
      ref="endpointForm"
      :available-tags="availableTags"
      @update="refreshSushiEndpoints"
    />

    <v-menu nudge-width="100" style="z-index:100" top offset-y>
      <template #activator="{ on, attrs }">
        <v-slide-y-reverse-transition>
          <v-btn
            v-show="hasSelection"
            fixed
            bottom
            right
            large
            color="primary"
            style="z-index:50; transition: bottom .3s ease"
            :style="hasSnackMessages && 'bottom:70px'"
            v-bind="attrs"
            v-on="on"
          >
            {{ $tc('endpoints.manageNendpoints', selected.length) }}
            <v-icon right>
              mdi-chevron-down
            </v-icon>
          </v-btn>
        </v-slide-y-reverse-transition>
      </template>

      <v-list>
        <v-list-item
          v-if="hasNonValidatedInSelection"
          :disabled="validating"
          @click="setEndpointsValidation(true)"
        >
          <v-list-item-icon>
            <v-icon>mdi-checkbox-marked-circle-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('validate') }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="hasValidatedInSelection"
          :disabled="validating"
          @click="setEndpointsValidation(false)"
        >
          <v-list-item-icon>
            <v-icon>mdi-checkbox-marked-circle-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('invalidate') }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :disabled="deleting" @click="deleteEndpoints()">
          <v-list-item-icon>
            <v-icon>mdi-delete</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('delete') }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item @click="clearSelection">
          <v-list-item-icon>
            <v-icon>mdi-close</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('deselect') }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-data-table
      v-model="selected"
      :headers="tableHeaders"
      :items="endpoints"
      :loading="refreshing"
      :search="search"
      :items-per-page="50"
      :footer-props="{ itemsPerPageOptions: [10, 20, 50, -1] }"
      :item-class="(item) => !item?.active && 'grey lighten-3 grey--text'"
      show-select
      show-expand
      single-expand
      item-key="id"
      sort-by="vendor"
      @pagination="currentItemCount = $event.itemsLength"
    >
      <template #expanded-item="{ headers, item }">
        <td />
        <td :colspan="headers.length - 1" class="py-4">
          <EndpointDetails :item="item" />
        </td>
      </template>

      <template #[`item.disabledUntil`]="{ item }">
        <EndpointDisabledIcon :endpoint="item" />
      </template>

      <template #[`item.active`]="{ item }">
        <v-tooltip left open-on-hover>
          <template #activator="{ on, attrs }">
            <div
              v-bind="attrs"
              v-on="on"
            >
              <v-switch
                :input-value="item.active"
                :label="item.active
                  ? $t('endpoints.active')
                  : $t('endpoints.inactive')"
                :loading="activeLoadingMap[item.id]"
                hide-details
                role="switch"
                class="mt-0"
                dense
                style="transform: scale(0.8);"
                @change="toggleEndpointActiveState(item)"
              />
            </div>
          </template>

          <i18n :path="`endpoints.${item.active ? 'activeSince' : 'inactiveSince'}`" tag="span">
            <template #date>
              <LocalDate :date="item.activeUpdatedAt" />
            </template>
          </i18n>
        </v-tooltip>
      </template>

      <template #[`item.tags`]="{ item }">
        <v-chip
          v-for="(tag, index) in item.tags"
          :key="index"
          label
          small
          color="primary"
          outlined
          class="ml-1"
        >
          {{ tag }}
        </v-chip>
      </template>

      <template #[`item.credentials`]="{ item }">
        <v-menu
          :disabled="!Array.isArray(item.credentials) || item.credentials?.length <= 0"
          transition="slide-y-transition"
          nudge-bottom="2"
          open-on-hover
          left
          offset-x
        >
          <template #activator="{ on, attrs }">
            <v-chip
              :outlined="item.credentials?.length <= 0"
              :to="`/admin/endpoints/${item.id}/sushi`"
              small
              class="elevation-1"
              v-bind="attrs"
              v-on="on"
            >
              {{ $tc('sushi.credentialsCount', item.credentials?.length) }}

              <v-icon right small>
                mdi-key
              </v-icon>
            </v-chip>
          </template>

          <v-card height="150" width="150">
            <v-card-text class="progress-menu">
              <ProgressCircularStack
                :value="credentialsStatuses.get(item.id) ?? []"
                :labels="[
                  `${item.id}-success`,
                  `${item.id}-unauthorized`,
                  `${item.id}-failed`,
                ]"
                size="100"
              >
                <template #[`default.${item.id}-success`]="{ value }">
                  <v-chip color="success" small style="margin: 1px 0">
                    {{ value }}

                    <v-icon right small>
                      mdi-check
                    </v-icon>
                  </v-chip>
                </template>

                <template #[`default.${item.id}-unauthorized`]="{ value }">
                  <v-chip color="warning" small style="margin: 1px 0">
                    {{ value }}

                    <v-icon right small>
                      mdi-key-alert-outline
                    </v-icon>
                  </v-chip>
                </template>

                <template #[`default.${item.id}-failed`]="{ value }">
                  <v-chip color="error" small style="margin: 1px 0">
                    {{ value }}

                    <v-icon right small>
                      mdi-alert-circle
                    </v-icon>
                  </v-chip>
                </template>
              </ProgressCircularStack>
            </v-card-text>
          </v-card>
        </v-menu>
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
            <v-list-item
              v-for="action in itemActions"
              :key="action.icon"
              @click="action.callback(item)"
            >
              <v-list-item-icon>
                <v-icon>{{ action.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ action.label }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <EndpointsFiltersDrawer
      v-model="filters"
      :show.sync="showEndpointFiltersDrawer"
      :search="search"
      :max-credentials-count="maxCounts.credentials"
      :max-credentials-status-counts="maxCounts.credentialsStatuses"
    />
    <ConfirmDialog ref="confirmDialog" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import EndpointForm from '~/components/EndpointForm.vue';
import EndpointDetails from '~/components/EndpointDetails.vue';
import EndpointsFiltersDrawer from '~/components/endpoints/EndpointsFiltersDrawer.vue';
import EndpointDisabledIcon from '~/components/endpoints/EndpointDisabledIcon.vue';
import ConfirmDialog from '~/components/ConfirmDialog.vue';
import ProgressCircularStack from '~/components/ProgressCircularStack.vue';
import LocalDate from '~/components/LocalDate.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    EndpointForm,
    EndpointDetails,
    ConfirmDialog,
    ProgressCircularStack,
    EndpointsFiltersDrawer,
    EndpointDisabledIcon,
    LocalDate,
  },
  data() {
    return {
      endpoints: [],
      selected: [],
      refreshing: false,
      deleting: false,
      validating: false,
      search: '',
      activeLoadingMap: {},
      currentItemCount: 0,

      filters: {},
      showEndpointFiltersDrawer: false,
    };
  },
  computed: {
    toolbarTitle() {
      if (this.hasSelection) {
        return this.$t('nSelected', { count: this.selected.length });
      }

      let count = this.endpoints?.length;
      if (count != null && this.currentItemCount !== count) {
        count = `${this.currentItemCount}/${count}`;
      }

      return this.$t('endpoints.title', { count: count ?? '?' });
    },
    hasSnackMessages() {
      const messages = this.$store?.state?.snacks?.messages;
      return Array.isArray(messages) && messages.length >= 1;
    },
    availableTags() {
      const tags = new Set(this.endpoints.flatMap((e) => (Array.isArray(e?.tags) ? e.tags : [])));
      return Array.from(tags);
    },
    tableHeaders() {
      return [
        {
          text: this.$t('endpoints.vendor'),
          value: 'vendor',
        },
        {
          text: this.$t('endpoints.tags'),
          value: 'tags',
          align: 'center',
          width: '200px',
        },
        {
          text: this.$t('endpoints.disabledUntil'),
          value: 'disabledUntil',
          align: 'center',
          width: '200px',
        },
        {
          text: this.$t('sushi.credentials'),
          value: 'credentials',
          align: 'center',
          width: '200px',
          filter: (_value, _search, item) => this.columnCredentialsFilter(item),
        },
        {
          text: this.$t('endpoints.active'),
          value: 'active',
          align: 'center',
          width: '130px',
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
    hasSelection() {
      return this.selected.length > 0;
    },
    hasValidatedInSelection() {
      return this.selected.some((endpoint) => endpoint?.validated);
    },
    hasNonValidatedInSelection() {
      return this.selected.some((endpoint) => !endpoint?.validated);
    },
    itemActions() {
      return [
        {
          icon: 'mdi-pencil',
          label: this.$t('modify'),
          callback: this.editEndpoint,
        },
        {
          icon: 'mdi-content-copy',
          label: this.$t('duplicate'),
          callback: this.duplicateItem,
        },
        {
          icon: 'mdi-identifier',
          label: this.$t('sushi.copyId'),
          callback: this.copyId,
        },
      ];
    },
    credentialsStatuses() {
      const entries = this.endpoints.map(
        (e) => {
          const credentials = e.credentials ?? [];
          const total = credentials.length || 1;

          const statuses = credentials.reduce(
            (acc, { connection }) => {
              const { status } = connection ?? {};
              if (status) {
                acc[status] += 1;
              }
              return acc;
            },
            {
              success: 0,
              unauthorized: 0,
              failed: 0,
            },
          );

          return [
            e.id,
            [
              {
                key: `${e.id}-success`,
                label: statuses.success,
                value: statuses.success / total,
                color: 'success',
              },
              {
                key: `${e.id}-unauthorized`,
                label: statuses.unauthorized,
                value: statuses.unauthorized / total,
                color: 'warning',
              },
              {
                key: `${e.id}-failed`,
                label: statuses.failed,
                value: statuses.failed / total,
                color: 'error',
              },
            ],
          ];
        },
      );

      return new Map(entries);
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
        credentials: 0,
        credentialsStatuses: {
          success: 0,
          unauthorized: 0,
          failed: 0,
        },
      };

      const getCredentialsStatusesCount = (credentials) => {
        const credentialsStatuses = {
          success: 0,
          unauthorized: 0,
          failed: 0,
        };
        // eslint-disable-next-line no-restricted-syntax
        for (const c of (credentials ?? [])) {
          const { status } = c.connection ?? {};
          if (status) {
            credentialsStatuses[status] += 1;
          }
        }
        return credentialsStatuses;
      };

      const setCounter = (property, endpoint) => {
        counters[property] = Math.max(counters[property], endpoint[property]?.length);
      };

      const setCredentialsStatusCounter = (property, statuses) => {
        counters.credentialsStatuses[property] = Math.max(
          counters.credentialsStatuses[property],
          statuses[property],
        );
      };

      // eslint-disable-next-line no-restricted-syntax
      for (const endpoint of this.endpoints) {
        setCounter('credentials', endpoint);

        const statuses = getCredentialsStatusesCount(endpoint.credentials);
        setCredentialsStatusCounter('success', statuses);
        setCredentialsStatusCounter('unauthorized', statuses);
        setCredentialsStatusCounter('failed', statuses);
      }

      return counters;
    },
  },
  mounted() {
    return this.refreshSushiEndpoints();
  },
  methods: {
    /**
     * Filter for credentials column using filters
     *
     * @param {*} item The item
     *
     * @return {boolean} If the item must be showed or not
     */
    columnCredentialsFilter(item) {
      return this.columnArrayFilter('credentials', item) && this.columnSushiFilter(item);
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
     * Apply sushi filters to given item
     *
     * @param {*} item The item
     *
     * @return {boolean} Should item be shown
     */
    columnSushiFilter(item) {
      const credentials = this.credentialsStatuses.get(item.id);
      if (!credentials) {
        return false;
      }

      const isInRange = (field, value) => {
        const range = this.filters[field]?.value;
        if (!range) {
          return true;
        }
        return range[0] <= value && value <= range[1];
      };

      const [success, unauthorized, failed] = credentials;
      const isSuccessInRange = isInRange('credsSuccessRange', success.label);
      const isUnauthorizedInRange = isInRange('credsUnauthorizedRange', unauthorized.label);
      const isFailedInRange = isInRange('credsFailedRange', failed.label);
      return isUnauthorizedInRange && isSuccessInRange && isFailedInRange;
    },
    async copyId(item) {
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
    showAvailableReports(item) {
      this.$refs.reportsDialog.showReports(item);
    },
    createEndpoint() {
      this.$refs.endpointForm.createEndpoint();
    },
    editEndpoint(item) {
      this.$refs.endpointForm.editEndpoint(item);
    },
    duplicateItem(item) {
      this.$refs.endpointForm.editEndpoint({ ...item, id: undefined });
    },
    async refreshSushiEndpoints() {
      this.refreshing = true;

      try {
        this.endpoints = await this.$axios.$get('/sushi-endpoints', { params: { include: ['credentials'], size: 0 } });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('endpoints.unableToRetriveEndpoints'));
      }

      this.refreshing = false;
    },

    clearSelection() {
      this.selected = [];
    },

    async toggleEndpointActiveState(item) {
      this.activeLoadingMap = { ...this.activeLoadingMap, [item.id]: true };

      const active = !item.active;

      await this.$axios.$patch(`/sushi-endpoints/${item.id}`, { active });

      const index = this.endpoints.findIndex((i) => i.id === item.id);

      if (index >= 0) {
        this.endpoints.splice(index, 1, { ...item, active });
      }

      this.activeLoadingMap = { ...this.activeLoadingMap, [item.id]: false };
    },

    async deleteEndpoints(items) {
      const endpoints = items || this.selected;
      if (endpoints.length === 0) {
        return;
      }

      const confirmed = await this.$refs.confirmDialog?.open({
        title: this.$t('areYouSure'),
        message: this.$tc(
          'endpoints.deleteNbEndpoints',
          endpoints.length,
        ),
        agreeText: this.$t('delete'),
        agreeIcon: 'mdi-delete',
      });

      if (!confirmed) {
        return;
      }
      this.removing = true;

      const requests = endpoints.map(async (item) => {
        let deleted = false;
        try {
          await this.$axios.$delete(`/sushi-endpoints/${item.id}`);
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

      const removeDeleted = (endpoint) => !removedIds.some((id) => endpoint.id === id);
      this.endpoints = this.endpoints.filter(removeDeleted);
      this.selected = this.selected.filter(removeDeleted);
    },
  },
};
</script>

<style scoped>
.progress-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
