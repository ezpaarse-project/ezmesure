<template>
  <section>
    <ToolBar :title="$t('endpoints.title', { total: totalEndpoints })">
      <v-spacer />

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

      <v-btn
        color="primary"
        text
        :loading="refreshing"
        @click.stop="refreshSushiEndpoints"
      >
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>

      <v-btn
        color="primary"
        text
        @click.stop="createEndpoint"
      >
        <v-icon left>
          mdi-key-plus
        </v-icon>
        {{ $t('add') }}
      </v-btn>
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
      show-select
      show-expand
      single-expand
      item-key="id"
      sort-by="vendor"
    >
      <template #expanded-item="{ headers, item }">
        <td />
        <td :colspan="headers.length - 1" class="py-4">
          <EndpointDetails :item="item" />
        </td>
      </template>

      <template #[`item.validated`]="{ item }">
        <v-chip
          v-if="item.validated"
          label
          small
          color="success"
          outlined
        >
          {{ $t('endpoints.validated') }}
        </v-chip>
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
        <v-chip
          v-if="Array.isArray(item.credentials)"
          :outlined="item.credentials?.length <= 0"
          small
          class="elevation-1"
          @click="$refs.credentialsDialog?.display?.(item)"
        >
          {{ $tc('sushi.credentialsCount', item.credentials.length) }}

          <v-icon right small>
            mdi-key
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

    <ConfirmDialog ref="confirmDialog" />
    <CredentialDialog ref="credentialsDialog" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import EndpointForm from '~/components/EndpointForm.vue';
import EndpointDetails from '~/components/EndpointDetails.vue';
import CredentialDialog from '~/components/sushis/CredentialDialog.vue';
import ConfirmDialog from '~/components/ConfirmDialog.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    EndpointForm,
    EndpointDetails,
    ConfirmDialog,
    CredentialDialog,
  },
  data() {
    return {
      endpoints: [],
      selected: [],
      refreshing: false,
      deleting: false,
      validating: false,
      search: '',
      loadingItems: {},
    };
  },
  computed: {
    hasSnackMessages() {
      const messages = this.$store?.state?.snacks?.messages;
      return Array.isArray(messages) && messages.length >= 1;
    },
    totalEndpoints() {
      return this?.endpoints.length || 0;
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
          text: this.$t('endpoints.validated'),
          value: 'validated',
          align: 'right',
          width: '130px',
        },
        {
          text: this.$t('sushi.credentials'),
          value: 'credentials',
          align: 'center',
          width: '200px',
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
  },
  mounted() {
    return this.refreshSushiEndpoints();
  },
  methods: {
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
        this.endpoints = await this.$axios.$get('/sushi-endpoints', { params: { include: ['credentials.institution'] } });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('endpoints.unableToRetriveEndpoints'));
      }

      this.refreshing = false;
    },

    clearSelection() {
      this.selected = [];
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

    async setEndpointsValidation(validated) {
      if (this.selected.length === 0) {
        return;
      }

      this.validating = true;

      const requests = this.selected.map(async (item) => {
        try {
          await this.$axios.$patch(`/sushi-endpoints/${item.id}`, { validated: !!validated });
        } catch (e) {
          this.$store.dispatch('snacks/error', this.$t('cannotUpdateItem', { id: item.vendor || item.id }));
        }
      });

      await Promise.all(requests);
      this.selected = [];
      this.validating = false;
      this.refreshSushiEndpoints();
    },
  },
};
</script>
