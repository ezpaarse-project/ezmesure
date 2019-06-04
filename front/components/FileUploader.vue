<template>
  <v-container>
    <p>
      Déposez ici les fichiers d'événements de consultations
      que vous souhaitez charger dans ezMESURE.
      Veuillez noter que le chargement n'est <strong>pas</strong> immédiat,
      et sera effectué par nos soins dès que possible.
      Nous vous invitons à lire nos
      <a href="http://blog.ezpaarse.org/2017/06/les-fichiers-ecs-dans-ezmesure/">règles de bonnes pratiques</a> afin de faciliter le processus,
      et à vous rapprocher de l'équipe si vous souhaitez
      en savoir plus sur l'automatisation des chargements.
      Les données chargées ne sont pas accessibles aux autres déposants.
    </p>

    <FileInput @change="addFilesToUpload" />

    <p class="ma-2 text-xs-right">
      <v-btn v-if="!noUploads" small @click="clearCompletedUploads">
        <v-icon left>
          clear_all
        </v-icon>
        Supprimer terminés
      </v-btn>
    </p>

    <v-card v-for="upload in uploads" :key="upload.id" class="my-3">
      <v-container fluid grid-list-lg>
        <v-layout row align-center>
          <v-flex>
            <v-progress-circular
              :indeterminate="!upload.error && !upload.progress"
              :value="upload.error ? 100 : upload.progress"
              :class="upload.error ? 'red--text' : 'teal--text'"
              size="50"
            >
              <v-scale-transition origin="center center" mode="out-in">
                <v-icon v-if="upload.error" key="error" class="red--text">
                  error
                </v-icon>
                <v-icon v-else-if="upload.done" key="done" class="teal--text">
                  done
                </v-icon>
                <span v-else key="progress">
                  {{ upload.progress }}%
                </span>
              </v-scale-transition>
            </v-progress-circular>
          </v-flex>

          <v-flex class="grow">
            <div class="body-2">
              {{ upload.file.name }}
            </div>

            <div class="grey--text">
              <span v-if="upload.error" class="red--text">
                {{ upload.errorMessage || 'Erreur' }}
              </span>
              <span v-else-if="upload.done">Chargé</span>
              <span v-else-if="upload.progress">Chargement en cours</span>
              <span v-else-if="upload.validating">Validation du fichier...</span>
              <span v-else>En attente</span>
            </div>
          </v-flex>

          <v-flex>
            <v-scale-transition origin="center center" mode="out-in">
              <v-btn v-if="upload.done" key="delete" icon ripple @click="removeUpload(upload.id)">
                <v-icon>delete</v-icon>
              </v-btn>
              <v-btn v-else key="clear" icon ripple @click="upload.cancel()">
                <v-icon>clear</v-icon>
              </v-btn>
            </v-scale-transition>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
  </v-container>
</template>

<script>
import Papa from 'papaparse';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CancelToken, isCancel } from 'axios';
import FileInput from './FileInput';

export default {
  components: {
    FileInput,
  },
  props: {
    onUpload: {
      type: Function,
      default: () => () => {},
    },
  },
  data() {
    return {
      uploadId: 1,
      uploads: [],
      uploading: false,
      hostedFiles: [],
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
    noUploads() {
      return this.uploads.length === 0;
    },
  },
  methods: {
    async addFilesToUpload(files) {
      files.forEach((file) => {
        this.uploads.push({
          file,
          id: this.uploadId += 1,
          progress: 0,
          done: false,
          req: null,
        });
      });

      if (!this.uploading) {
        await this.uploadNextFile();
      }
    },

    async uploadNextFile() {
      const upload = this.uploads.find(u => !u.done);
      if (!upload) {
        this.uploading = false;
        if (typeof this.onUpload === 'function') { this.onUpload(); }
        return;
      }

      this.uploading = true;

      upload.validating = true;
      try {
        await this.validateFile(upload.file);
      } catch (err) {
        upload.error = err;
        upload.errorMessage = err.message;
      }
      upload.validating = false;

      if (!upload.error) {
        const source = CancelToken.source();
        upload.cancel = () => { source.cancel(); };

        try {
          upload.req = this.$axios.put(`/files/${upload.file.name}`, upload.file, {
            cancelToken: source.token,
            onUploadProgress: (event) => {
              if (event.lengthComputable) {
                upload.progress = Math.floor(event.loaded / event.total * 100);
              }
            },
          });

          await upload.req;
        } catch (e) {
          const data = e.response && e.response.data;
          upload.error = e;
          upload.errorMessage = isCancel(e) ? 'Annulé' : (data && data.error) || e.statusText;
        }
      }

      upload.done = true;
      setTimeout(() => this.uploadNextFile(), 500);
    },

    async validateFile(file) {
      return new Promise((resolve, reject) => {
        if (typeof FileReader === 'undefined') { resolve(); return; }
        if (/\.csv\.gz$/i.test(file.name)) { resolve(); return; }

        if (!/\.csv$/i.test(file.name)) {
          reject(new Error('Le fichier n\'est pas un CSV'));
          return;
        }

        const mandatoryFields = [
          'datetime',
          'log_id',
          'rtype',
          'mime',
          'title_id',
          'doi',
        ];

        const readLimit = 50;
        let lineNumber = 0;
        let columns;
        let err;

        Papa.parse(file, {
          delimiter: ';',
          error: e => reject(e),
          step: ({ data, errors }, parser) => {
            lineNumber += 1;
            if (lineNumber > readLimit) {
              parser.abort();
              return;
            }
            const row = data[0];

            if (errors.length > 0) {
              // eslint-disable-next-line prefer-destructuring
              err = errors[0];

              if (err.type === 'Quotes') {
                err.message = `Ligne #${lineNumber}: un champ entre guillemets est mal formaté`;
              }

              parser.abort();
              return;
            }

            if (typeof columns === 'undefined') {
              columns = row;

              const missingField = mandatoryFields.find(field => !columns.includes(field));

              if (missingField) {
                err = new Error(`Le champ "${missingField}" est manquant`);
                parser.abort();
              }
              return;
            }

            const obj = {};

            columns.forEach((colName, index) => {
              obj[colName] = row[index];
            });

            if (!obj.log_id) {
              err = new Error(`Ligne #${lineNumber}: champ "log_id" vide`);
            } else if (!obj.datetime) {
              err = new Error(`Ligne #${lineNumber}: champ "datetime" vide`);
            } else if (Number.isNaN(Date.parse(obj.datetime))) {
              err = new Error(`Ligne #${lineNumber}: champ "datetime" invalide, le fichier a-t-il été modifié ?`);
            } else if (obj.date && !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) {
              err = new Error(`Ligne #${lineNumber}: champ "date" invalide, le fichier a-t-il été modifié ?`);
            }

            if (err) {
              parser.abort();
            }
          },
          complete: () => {
            if (err) { reject(err); } else { resolve(); }
          },
        });
      });
    },

    removeUpload(id) {
      this.uploads = this.uploads.filter(upload => upload.id !== id);
    },

    clearCompletedUploads() {
      this.uploads = this.uploads.filter(u => !u.done);
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
</style>
