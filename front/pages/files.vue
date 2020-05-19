<template>
  <section>
    <ToolBar v-if="nbSelectedFiles === 0" flat title="Mes dépots">
      <slot>
        <v-spacer />

        <v-btn text @click="refreshFileList">
          <v-icon left>
            mdi-refresh
          </v-icon>
          Actualiser
        </v-btn>
      </slot>
    </ToolBar>


    <ToolBar v-else title="Mes dépots">
      <slot>
        <v-btn icon @click="deselectFiles">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-toolbar-title>
          {{ nbSelectedFiles }} sélectionné(s)
        </v-toolbar-title>

        <v-spacer />

        <v-btn text @click="deleteSelectedFiles">
          <v-icon left>
            mdi-delete
          </v-icon>
          Supprimer
        </v-btn>
      </slot>
    </ToolBar>

    <v-tabs v-model="activeFilesTab" grow>
      <v-tab href="#tab-files-list">
        Liste
      </v-tab>
      <v-tab href="#tab-files-upload">
        Déposer
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
import FileList from '~/components/file/FileList';
import FileUploader from '~/components/file/FileUploader';
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: 'isLoggin',
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
