<template>
  <section>
    <v-toolbar v-if="nbSelectedFiles === 0" dense flat>
      <v-toolbar-title>
        Mes dépôts
      </v-toolbar-title>

      <v-spacer />

      <v-btn text @click="refreshFileList">
        <v-icon left>
          mdi-refresh
        </v-icon>
        Actualiser
      </v-btn>
    </v-toolbar>

    <v-toolbar v-else dense flat dark>
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
    </v-toolbar>

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
import FileList from '~/components/FileList';
import FileUploader from '~/components/FileUploader';

export default {
  components: {
    FileList,
    FileUploader,
  },
  // eslint-disable-next-line vue/require-prop-types
  props: ['nbSelectedFiles'],
  data() {
    return {
      activeFilesTab: 'tab-files-list',
    };
  },
  methods: {
    refreshFileList() {
      this.$emit('refreshFiles');
    },

    deleteSelectedFiles() {
      this.$emit('deleteSelected');
    },

    deselectFiles() {
      this.$emit('deselectAll');
    },
  },
};
</script>
