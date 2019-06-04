<template>
  <div>
    <p class="text-xs-right">
      <v-btn small :disabled="noFileSelected" @click="deleteSelected">
        <v-icon left>
          delete
        </v-icon>
        Supprimer
      </v-btn>
      <v-btn small @click="refreshFiles">
        <v-icon left>
          refresh
        </v-icon>
        Actualiser
      </v-btn>
    </p>

    <v-data-table
      v-model="selected"
      :items="files"
      :headers="headers"
      :loading="loading"
      item-key="name"
      select-all
      no-data-text="Aucun fichier"
      no-results-text="Aucun fichier"
      rows-per-page-text="Lignes par page"
    >
      <template slot="headerCell" slot-scope="props">
        {{ props.header.text }}
      </template>

      <template slot="items" slot-scope="props">
        <td>
          <v-checkbox
            v-model="props.selected"
            primary
            hide-details
          />
        </td>

        <td class="nowrap">
          {{ props.item.name }}
        </td>
        <td class="nowrap">
          {{ props.item.prettySize }}
        </td>
        <td class="nowrap">
          {{ props.item.prettyLastModified }}
        </td>
      </template>

      <template slot="pageText" slot-scope="props">
        {{ props.pageStart }}-{{ props.pageStop }} sur {{ props.itemsLength }}
      </template>
    </v-data-table>
  </div>
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
      headers: [
        {
          align: 'left',
          text: 'Nom',
          value: 'name',
          class: 'grow',
        }, {
          align: 'left',
          text: 'Taille',
          value: 'size',
        }, {
          align: 'left',
          text: 'Modifié',
          value: 'lastModified',
        },
      ],
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
  },
  methods: {
    async refreshFiles() {
      this.loading = true;

      try {
        this.hostedFiles = (await this.$axios.get('/files')).data;
      } catch (e) {
        console.error(e);
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
        console.error(e);
      }

      this.selected = [];
      await this.refreshFiles();
      this.loading = false;
    },
  },
};
</script>

<style scoped>
.grow {
  width: 100%;
}
.nowrap {
  white-space: nowrap;
}
.flex {
  flex: 0 1 auto;
}
.flex.grow {
  flex-grow: 1;
}
p {
  text-align: justify;
}
</style>
