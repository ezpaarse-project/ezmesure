<template>
  <section>
    <ToolBar v-if="nbSelectedFiles === 0" flat :title="$t('files.title')">
      <slot>
        <v-spacer />

        <v-btn text @click="refreshFileList">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>
      </slot>
    </ToolBar>

    <ToolBar v-else :title="$t('files.title')">
      <slot>
        <v-btn icon @click="deselectFiles">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-toolbar-title>
          {{ $t('files.count', { count: nbSelectedFiles }) }}
        </v-toolbar-title>

        <v-spacer />

        <v-btn text @click="deleteSelectedFiles">
          <v-icon left>
            mdi-delete
          </v-icon>
          {{ $t('delete') }}
        </v-btn>
      </slot>
    </ToolBar>

    <v-tabs v-model="activeFilesTab" grow>
      <v-tab href="#tab-files-list">
        {{ $t('files.list') }}
      </v-tab>
      <v-tab href="#tab-files-upload">
        {{ $t('files.submit') }}
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="activeFilesTab">
      <v-tab-item id="tab-files-list">
        <FileList ref="filelist" @select="selectedFiles = $event" />
      </v-tab-item>

      <v-tab-item id="tab-files-upload">
        <FileUploader @upload="refreshFileList" />
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
import FileList from '~/components/file/FileList.vue';
import FileUploader from '~/components/file/FileUploader.vue';
import ToolBar from '~/components/space/ToolBar.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    FileList,
    FileUploader,
  },
  data() {
    return {
      activeFilesTab: 'tab-files-list',
      selectedFiles: [],
    };
  },
  computed: {
    nbSelectedFiles() { return this.selectedFiles.length; },
  },
  methods: {
    refreshFileList() {
      this.$refs.filelist.refreshFiles();
    },

    deleteSelectedFiles() {
      this.$refs.filelist.deleteSelected();
    },

    deselectFiles() {
      this.$refs.filelist.deselectAll();
    },
  },
};
</script>
