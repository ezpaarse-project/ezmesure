<template>
  <v-card>
    <v-toolbar card>
      <v-toolbar-title>Mes fichiers</v-toolbar-title>

      <v-spacer/>

      <v-btn icon @click="deleteSelected" :disabled="noFileSelected" v-tooltip:left="{ html: 'Supprimer' }">
        <v-icon>delete</v-icon>
      </v-btn>
      <v-btn icon @click="clearCompletedUploads" :disabled="noUploads" v-tooltip:left="{ html: 'Vider chargements terminés' }">
        <v-icon>clear_all</v-icon>
      </v-btn>
      <v-btn icon @click="fetchHostedFiles" v-tooltip:left="{ html: 'Actualiser' }">
        <v-icon>refresh</v-icon>
      </v-btn>
    </v-toolbar>

    <v-tabs centered>
      <v-tabs-bar class="grey lighten-4">
        <v-tabs-slider></v-tabs-slider>
        <v-tabs-item href="#tab-list">Liste</v-tabs-item>
        <v-tabs-item href="#tab-upload">Charger</v-tabs-item>
      </v-tabs-bar>

      <v-tabs-items>
        <v-tabs-content id="tab-list">
          <v-data-table
            :items="files"
            :headers="headers"
            :loading="loading"
            v-model="selected"
            selected-key="name"
            select-all
            no-data-text="Aucun fichier"
            no-results-text="Aucun fichier"
            rows-per-page-text="Lignes par page"
          >
            <template slot="headerCell" scope="props">
              {{ props.header.text }}
            </template>

            <template slot="items" scope="props">
              <td>
                <v-checkbox
                  primary
                  hide-details
                  v-model="props.selected"
                ></v-checkbox>
              </td>

              <td class="nowrap">{{ props.item.name }}</td>
              <td class="nowrap">{{ props.item.prettySize }}</td>
              <td class="nowrap">{{ props.item.prettyLastModified }}</td>
            </template>

            <template slot="pageText" scope="props">
              {{ props.pageStart }}-{{ props.pageStop }} sur {{ props.itemsLength }}
            </template>
          </v-data-table>
        </v-tabs-content>

        <v-tabs-content id="tab-upload">
          <v-container>
            <FileInput @change="addFilesToUpload"/>

            <v-card class="my-3" v-for="upload in uploads" :key="upload.id">
              <v-container fluid grid-list-lg>
                <v-layout row align-center>

                  <v-flex>
                    <v-progress-circular
                      :indeterminate="!upload.progress"
                      :value="upload.progress"
                      :class="upload.error ? 'red--text' : 'teal--text'"
                      size="50"
                    >
                      <v-scale-transition origin="center center" mode="out-in">
                        <v-icon key="error" class="red--text" v-if="upload.error">error</v-icon>
                        <v-icon key="done" class="teal--text" v-else-if="upload.done">done</v-icon>
                        <span key="progress" v-else>{{ upload.progress }}%</span>
                      </v-scale-transition>
                    </v-progress-circular>
                  </v-flex>

                  <v-flex class="grow">
                    <div class="body-2">{{ upload.file.name }}</div>

                    <div class="grey--text">
                      <span v-if="upload.error" class="red--text">
                        {{ upload.errorMessage || 'Erreur' }}
                      </span>
                      <span v-else-if="upload.done">Chargé</span>
                      <span v-else-if="upload.progress">Chargement en cours</span>
                      <span v-else>En attente</span>
                    </div>
                  </v-flex>

                  <v-flex>
                    <v-scale-transition origin="center center" mode="out-in">
                      <v-btn key="delete" v-if="upload.done" icon ripple @click="removeUpload(upload.id)">
                        <v-icon>delete</v-icon>
                      </v-btn>
                      <v-btn key="clear" v-else icon ripple @click="upload.cancel()">
                        <v-icon>clear</v-icon>
                      </v-btn>
                    </v-scale-transition>
                  </v-flex>

                </v-layout>
              </v-container>
            </v-card>
          </v-container>
        </v-tabs-content>

      </v-tabs-items>
    </v-tabs>

  </v-card>
</template>

<script>
import FileInput from './FileInput'
import prettyBytes from 'pretty-bytes'
import { CancelToken, isCancel } from 'axios'

export default {
  components: {
    FileInput
  },
  async mounted () {
    this.fetchHostedFiles()
  },
  data () {
    return {
      uploadId: 1,
      uploads: [],
      hostedFiles: [],
      selected: [],
      loading: false,
      showUploader: false,
      headers: [
        { align: 'left', text: 'Nom', value: 'name', class: 'grow' },
        { align: 'left', text: 'Taille', value: 'size' },
        { align: 'left', text: 'Modifié', value: 'lastModified' }
      ]
    }
  },
  computed: {
    files () {
      return this.hostedFiles.map(file => {
        file.prettySize = prettyBytes(file.size)
        file.prettyCreatedAt = new Date(file.createdAt).toLocaleString()
        file.prettyLastModified = new Date(file.lastModified).toLocaleString()
        return file
      })
    },
    noFileSelected () {
      return this.selected.length === 0
    },
    noUploads () {
      return this.uploads.length === 0
    }
  },
  methods: {
    async fetchHostedFiles () {
      this.loading = true

      try {
        this.hostedFiles = (await this.$axios.get('/files')).data
      } catch (e) {
        console.error(e)
      }

      this.loading = false
    },

    async addFilesToUpload (files) {
      files.forEach(file => {
        this.uploads.push({
          file,
          id: this.uploadId++,
          progress: 0,
          done: false,
          req: null
        })
      })

      await this.uploadNextFile()
    },

    async uploadNextFile () {
      const upload = this.uploads.find(u => !u.done)
      if (!upload) {
        return this.fetchHostedFiles()
      }

      const source = CancelToken.source()

      upload.cancel = () => { source.cancel() }

      try {
        upload.req = this.$axios.put(`/files/${upload.file.name}`, upload.file, {
          cancelToken: source.token,
          onUploadProgress: (event) => {
            if (event.lengthComputable) {
              upload.progress = Math.floor(event.loaded / event.total * 100)
            }
          }
        })

        await upload.req
      } catch (e) {
        const data = e.response && e.response.data
        upload.error = e
        upload.errorMessage = isCancel(e) ? 'Annulé' : data || e.statusText
      }

      upload.done = true

      setTimeout(() => this.uploadNextFile(), 500)
    },

    removeUpload (id) {
      this.uploads = this.uploads.filter(upload => upload.id !== id)
    },

    clearCompletedUploads () {
      this.uploads = this.uploads.filter(u => !u.done)
    },

    async deleteSelected () {
      if (!this.selected.length === 0) { return }

      this.loading = true
      const entries = this.selected.map(f => f.name)

      try {
        await this.$axios.post('/files/delete_batch', { entries })
      } catch (e) {
        console.error(e)
      }

      await this.fetchHostedFiles()
      this.loading = false
    }
  }
}
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
</style>
