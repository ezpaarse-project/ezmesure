<template>
  <v-dialog v-model="show" width="800">
    <v-card>
      <v-toolbar flat color="rgba(0, 0, 0, 0)">
        <v-toolbar-title>
          {{ $t('sushi.files.title') }}
          <div class="caption">
            {{ sushiVendor }} - {{ sushiTags }}
          </div>
        </v-toolbar-title>

        <v-spacer />

        <v-btn text color="primary" :loading="refreshing" @click="refreshFiles">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>
      </v-toolbar>

      <v-treeview
        v-if="hasFiles"
        :items="files"
        item-key="name"
        open-on-click
      >
        <template #prepend="{ item, open }">
          <v-icon v-if="item.children">
            {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
          </v-icon>
          <v-icon v-else>
            mdi-file-outline
          </v-icon>
        </template>

        <template #append="{ item }">
          <span v-if="Array.isArray(item.children)" class="caption">
            {{ $tc('sushi.files.nbFiles', item.children.length) }}
          </span>
          <span v-else class="caption">
            {{ prettySize(item.size) }} - <LocalDate :date="item.mtime" format="Pp" />
          </span>
          <v-btn v-if="item.href" small text color="primary" :href="item.href">
            <v-icon left>
              mdi-download
            </v-icon>
            {{ $t('download') }}
          </v-btn>
        </template>
      </v-treeview>

      <v-card-text v-else class="text-center py-4">
        {{ $t('sushi.files.noFilesAvailable') }}
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import prettyBytes from 'pretty-bytes';
import LocalDate from '~/components/LocalDate.vue';

export default {
  components: {
    LocalDate,
  },
  data() {
    return {
      show: false,
      refreshing: false,
      sushi: null,
      files: [],
    };
  },
  computed: {
    hasSushiItem() { return !!this.sushi?.id; },
    hasFiles() { return Array.isArray(this.files) && this.files.length > 0; },
    sushiVendor() { return this.sushi?.endpoint?.vendor; },
    sushiTags() { return this.sushi?.tags?.join?.(', '); },
  },
  methods: {
    prettySize(size) {
      return prettyBytes(size);
    },

    showFiles(sushiData = {}) {
      this.sushi = sushiData;
      this.files = [];
      this.show = true;
      this.refreshFiles();
    },

    async refreshFiles() {
      if (!this.hasSushiItem) { return; }

      this.refreshing = true;

      try {
        this.files = await this.$axios.$get(`/sushi/${this.sushi.id}/files`);
      } catch (e) {
        const errorMessage = e?.response?.data?.error || this.$t('errors.generic');
        this.$store.dispatch('snacks/error', errorMessage);
      }

      this.refreshing = false;
    },
  },
};
</script>
