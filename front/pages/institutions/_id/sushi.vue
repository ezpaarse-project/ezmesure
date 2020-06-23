<template>
  <section>
    <ToolBar :title="$t('institutions.sushi.title', { institutionName: institution.name })">
      <slot>
        <v-spacer />
        <v-btn
          v-if="hasInstitution"
          color="primary"
          @click.stop="createSushiItem"
        >
          <v-icon left>
            mdi-key-plus
          </v-icon>
          {{ $t('add') }}
        </v-btn>
      </slot>
    </ToolBar>

    <SushiForm
      ref="sushiForm"
      :platforms="platforms"
      :vendors="vendors"
      @update="refreshSushiItems"
    />

    <v-data-table
      v-if="hasInstitution"
      v-model="selected"
      :headers="headers"
      :items="sushiItems"
      :loading="refreshing"
      show-select
      item-key="id"
    >
      <template v-slot:item.name="{ item }">
        {{ item.vendor }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          @click="editSushiItem(item)"
        >
          mdi-pencil
        </v-icon>
      </template>

      <template v-slot:footer>
        <span v-if="selected.length">
          <v-btn small color="error" class="ma-2" @click="deleteData">
            <v-icon left>mdi-delete</v-icon>
            {{ $t('delete') }} ({{ selected.length }})
          </v-btn>
        </span>
      </template>
    </v-data-table>

    <v-card v-else tile flat color="transparent">
      <v-card-text>
        <div class="mb-2" v-text="$t('institutions.notAttachedToAnyInstitution')" />
        <a :href="'/info/institution'" v-text="$t('institutions.reportInstitutionInformation')" />
      </v-card-text>
    </v-card>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';
import SushiForm from '~/components/SushiForm';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    SushiForm,
  },
  async asyncData({
    $axios,
    store,
    params,
    app,
  }) {
    let institution = null;

    try {
      institution = await $axios.$get(`/institutions/${params.id}`);
    } catch (e) {
      if (e.response?.status === 404) {
        institution = {};
      } else {
        store.dispatch('snacks/error', app.i18n.t('institutions.unableToRetriveInformations'));
      }
    }

    let platforms = [];
    try {
      platforms = await $axios.$get('/sushi');
    } catch (e) {
      store.dispatch('snacks/error', app.i18n.t('institutions.unableToRetrivePlatforms'));
    }

    return {
      institution,
      sushiItems: [],
      selected: [],
      refreshing: false,
      headers: [
        {
          text: app.i18n.t('institutions.sushi.label'),
          value: 'name',
        },
        {
          text: 'Actions',
          value: 'actions',
          sortable: false,
          width: '100px',
          align: 'right',
        },
      ],
      platforms,
    };
  },
  computed: {
    hasInstitution() {
      return !!this.institution?.id;
    },
    vendors() {
      return this.platforms.map(p => p.vendor);
    },
  },
  mounted() {
    return this.refreshSushiItems();
  },
  methods: {
    createSushiItem() {
      this.$refs.sushiForm.createSushiItem(this.institution.id);
    },
    editSushiItem(item) {
      this.$refs.sushiForm.editSushiItem(this.institution.id, item);
    },
    async refreshSushiItems() {
      if (!this.hasInstitution) { return; }

      this.refreshing = true;

      try {
        this.sushiItems = await this.$axios.$get(`/institutions/${this.institution.id}/sushi`);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.sushi.unableToRetriveSushiData'));
      }

      this.refreshing = false;
    },
    async deleteData() {
      if (this.selected.length === 0) {
        return;
      }

      const ids = this.selected.map(select => select.id);
      let response;

      try {
        response = await this.$axios.$post(`/institutions/${this.institution.id}/sushi/delete`, { ids });
        if (!Array.isArray(response)) {
          throw new Error('invalid response');
        }
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItems', { count: this.selected.length }));
        return;
      }

      const failed = response.filter(item => item?.status !== 'deleted');
      const deleted = response.filter(item => item?.status === 'deleted');

      failed.forEach(({ id }) => {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItem', { id }));
      });


      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', this.$t('itemsDeleted', { count: deleted.length }));

        const removeDeleted = ({ id }) => !deleted.some(item => item.id === id);
        this.sushiItems = this.sushiItems.filter(removeDeleted);
        this.selected = this.selected.filter(removeDeleted);
      }
    },
  },
};
</script>
