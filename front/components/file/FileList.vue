<template>
  <v-data-table
    v-model="selected"
    :items="files"
    :headers="headers"
    :loading="loading"
    item-key="name"
    show-select
    :no-data-text="$t('files.noFile')"
    :no-results-text="$t('files.noFile')"
  >
    <template v-slot:item.lastModified="{ item }">
      {{ item.prettyLastModified }}
    </template>

    <template v-slot:item.size="{ item }">
      {{ item.prettySize }}
    </template>
  </v-data-table>
</template>

<script>
import prettyBytes from 'pretty-bytes';

export default {
  async mounted() {
    this.refreshFiles();
  },
  data() {
    return {
      selectedTab: 'tab-list',
      uploadId: 1,
      hostedFiles: [],
      selected: [],
      loading: false,
    };
  },
  computed: {
    files() {
      return this.hostedFiles.map(file => ({
        ...file,
        prettySize: prettyBytes(file.size),
        prettyCreatedAt: new Date(file.createdAt).toLocaleString(),
        prettyLastModified: new Date(file.lastModified).toLocaleString(),
      }));
    },
    noFileSelected() {
      return this.selected.length === 0;
    },
    headers() {
      return [
        {
          align: 'left',
          text: this.$t('files.name'),
          value: 'name',
        }, {
          align: 'left',
          text: this.$t('files.modified'),
          value: 'lastModified',
          width: '220px',
        }, {
          align: 'left',
          text: this.$t('files.size'),
          value: 'size',
          width: '120px',
        },
      ];
    },
  },
  watch: {
    selected() {
      this.$emit('select', this.selected);
    },
  },
  methods: {
    deselectAll() {
      this.selected = [];
    },

    async refreshFiles() {
      this.loading = true;

      try {
        this.hostedFiles = (await this.$axios.get('/files')).data;
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('files.updatingFailed'));
      }

      this.loading = false;
    },

    async deleteSelected() {
      if (!this.selected.length === 0) { return; }

      this.loading = true;
      const entries = this.selected.map(f => f.name);

      try {
        await this.$axios.post('/files/delete_batch', { entries });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('files.deletingFailed'));
      }

      this.selected = [];
      await this.refreshFiles();
      this.loading = false;
    },
  },
};
</script>
