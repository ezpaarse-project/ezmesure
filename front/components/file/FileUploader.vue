<template>
  <v-container>
    <i18n path="files.depositFiles.text" tag="p">
      <template #not>
        <strong>{{ $t('files.depositFiles.not') }}</strong>
      </template>

      <template #bestPracticeLink>
        <a href="http://blog.ezpaarse.org/2017/06/les-fichiers-ecs-dans-ezmesure/">{{ $t('files.depositFiles.bestPracticeLink') }}</a>
      </template>
    </i18n>

    <FileInput @change="addFilesToUpload" />

    <v-container fluid grid-list-md class="px-0">
      <v-layout column>
        <v-flex>
          <div class="text-right">
            <v-btn v-if="!noUploads" @click="clearCompletedUploads">
              <v-icon left>
                mdi-notification-clear-all
              </v-icon>
              {{ $t('files.deleteCompleted') }}
            </v-btn>
          </div>
        </v-flex>
        <v-flex v-for="upload in uploads" :key="upload.id">
          <v-card>
            <v-container
              fluid
              grid-list-md
              pa-2
            >
              <v-layout row align-center>
                <v-flex shrink>
                  <v-scale-transition origin="center center" mode="out-in">
                    <v-icon v-if="!upload.index" size="50">
                      mdi-dots-horizontal
                    </v-icon>
                    <v-icon v-else-if="upload.error" size="50" class="error--text">
                      mdi-alert-circle-outline
                    </v-icon>
                    <v-icon v-else-if="upload.done" size="50" class="success--text">
                      mdi-check
                    </v-icon>

                    <v-progress-circular
                      v-else
                      :indeterminate="!upload.error && !upload.progress"
                      :value="upload.error ? 100 : upload.progress"
                      :class="upload.error ? 'error--text' : 'primary--text'"
                      size="50"
                      width="3"
                    >
                      {{ upload.progress }}%
                    </v-progress-circular>
                  </v-scale-transition>
                </v-flex>

                <v-flex grow>
                  <div class="body-1 grey--text text--darken-3">
                    {{ upload.file.name }}
                  </div>

                  <div class="grey--text">
                    <span v-if="upload.error" class="error--text">
                      {{ upload.errorMessage || $t('error') }}
                    </span>

                    <span v-else-if="upload.done">
                      {{ upload.index !== noIndexSymbol
                        ? $t('files.loaded')
                        : $t('files.uploaded') }}
                    </span>

                    <span v-else-if="upload.progress">
                      {{ $t('files.loadingInProgress') }}
                    </span>

                    <span v-else-if="upload.validating">
                      {{ $t('files.validatingFile') }}
                    </span>

                    <span v-else>
                      {{ $t('files.isWaiting') }}
                    </span>
                  </div>
                </v-flex>

                <div style="width: 400px;">
                  <v-scale-transition origin="center center" mode="out-in">
                    <FileIndexSelectorMenu @update:modelValue="onIndexSelect(upload, $event)">
                      <template #activator="{ display }">
                        <v-select
                          :value="upload.repository"
                          :label="$t('files.affectedRepository')"
                          :items="repositoriesItemsOfUser"
                          :disabled="!!upload.index"
                          :hint="upload.index === noIndexSymbol
                            ? $t('files.letAdminDesc')
                            : upload.index
                          "
                          persistent-hint
                          @change="onRepositorySelect(upload, $event)"
                        >
                          <template v-if="upload.repository && !upload.index" #append-outer>
                            <v-btn
                              color="error"
                              small
                              @click="display(indicesOfRepo[upload.repository] || [])"
                            >
                              <v-icon>mdi-database</v-icon>
                            </v-btn>
                          </template>
                        </v-select>
                      </template>
                    </FileIndexSelectorMenu>
                  </v-scale-transition>
                </div>

                <v-spacer />

                <v-flex shrink>
                  <v-scale-transition origin="center center" mode="out-in">
                    <v-btn
                      v-if="upload.cancel && !upload.done"
                      icon
                      ripple
                      @click="upload.cancel()"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-btn v-else icon ripple @click="removeUpload(upload.id)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-scale-transition>
                </v-flex>
              </v-layout>
            </v-container>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-container>
</template>

<script>
import Papa from 'papaparse';
import prettyBytes from 'pretty-bytes';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CancelToken, isCancel } from 'axios';
import FileInput from './FileInput.vue';
import FileIndexSelectorMenu from './FileIndexSelectorDialog.vue';

const noIndexSymbol = Symbol.for('deposit without index');

export default {
  components: {
    FileInput,
    FileIndexSelectorMenu,
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
      memberships: [],
      availableIndices: [],
      indicesOfRepo: {},
      loading: false,
      noIndexSymbol,
    };
  },
  computed: {
    institutionsOfUser() {
      return new Map(this.memberships.map((m) => [m.institutionId, m.institution]));
    },
    repositoryPermsOfUser() {
      return (this.$auth.user?.memberships ?? [])
        .map((m) => m.repositoryPermissions ?? [])
        .flat()
        .filter((p) => !p.readonly && p.repository?.type === 'ezpaarse');
    },
    permsOfUserPerInstitution() {
      const permMap = new Map();
      // eslint-disable-next-line no-restricted-syntax
      for (const permission of this.repositoryPermsOfUser) {
        const repos = permMap.get(permission.institutionId) ?? [];
        repos.push(permission);
        permMap.set(permission.institutionId, repos);
      }
      return permMap;
    },
    repositoriesItemsOfUser() {
      const items = Array.from(this.permsOfUserPerInstitution.entries())
        .map(([institutionId, permissions]) => {
          const institution = this.institutionsOfUser.get(institutionId);
          let label = 'Unknown';
          if (institution?.name) {
            label = institution.name;
            if (institution.acronym) {
              label += ` (${institution.acronym})`;
            }
          }

          return [
            { header: label, value: institutionId },
            ...permissions.map(({ repository }) => ({
              text: repository.pattern,
              value: repository.pattern,
            })),
          ];
        })
        .flat();

      return [
        { text: this.$t('files.letAdmin'), value: noIndexSymbol },
        ...items,
      ];
    },
    noUploads() {
      return this.uploads.length === 0;
    },
    headers() {
      return [
        {
          align: 'left',
          text: this.$t('files.name'),
          value: 'name',
          class: 'grow',
        }, {
          align: 'left',
          text: this.$t('files.size'),
          value: 'size',
        }, {
          align: 'left',
          text: this.$t('files.modified'),
          value: 'lastModified',
        },
      ];
    },
  },
  mounted() {
    this.refreshMemberships();
  },
  methods: {
    async refreshMemberships() {
      try {
        this.memberships = await this.$axios.$get('/profile/memberships');
      } catch (error) {
        this.$store.dispatch('snacks/error', this.$t('anErrorOccurred'));
      }
    },

    async refreshIndicesOfRepo(pattern) {
      try {
        const indices = await this.$axios.$get(`/repositories/${pattern}/_resolve`);
        this.indicesOfRepo[pattern] = indices;
      } catch (error) {
        this.$store.dispatch('snacks/error', this.$t('anErrorOccurred'));
      }
    },

    async addFilesToUpload(files) {
      files.forEach((file) => {
        this.uploads.push({
          file,
          prettySize: prettyBytes(file.size),
          id: this.uploadId += 1,
          progress: 0,
          done: false,
          req: null,
          index: '',
          repository: '',
        });
      });
    },

    async onRepositorySelect(upload, pattern) {
      if (pattern === noIndexSymbol) {
        this.onIndexSelect(upload, noIndexSymbol);
        return;
      }

      upload.repository = pattern || '';
      if (!pattern) {
        return;
      }

      await this.refreshIndicesOfRepo(pattern);
      const indices = this.indicesOfRepo[pattern] || [];
      if (indices.length === 0) {
        this.onIndexSelect(upload, noIndexSymbol);
      }
      if (indices.length === 1) {
        this.onIndexSelect(upload, indices[0]?.name);
      }
    },

    async onIndexSelect(upload, index) {
      upload.index = index || '';
      if (!index) {
        return;
      }

      if (!this.uploading) {
        await this.uploadNextFile();
      }
    },

    async uploadNextFile() {
      const upload = this.uploads.find((u) => !u.done && u.index);
      if (!upload) {
        this.uploading = false;
        this.$emit('upload');
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
          const hasIndex = upload.index !== noIndexSymbol;
          const method = hasIndex ? 'POST' : 'PUT';
          const url = hasIndex ? `/logs/${upload.index}` : `/files/${upload.file.name}`;

          upload.req = this.$axios.$request({
            method,
            url,
            data: upload.file,
            cancelToken: source.token,
            onUploadProgress: (event) => {
              if (event.lengthComputable) {
                upload.progress = Math.floor((event.loaded / event.total) * 100);
              }
            },
          });

          await upload.req;
        } catch (e) {
          const data = e.response && e.response.data;
          upload.error = e;
          upload.errorMessage = isCancel(e) ? this.$t('canceled') : (data && data.error) || e.statusText;
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
          reject(new Error(this.$t('files.isNotCSV')));
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
        let emptyLines = 0;
        let columns;
        let err;

        Papa.parse(file, {
          delimiter: ';',
          error: (e) => reject(e),
          step: ({ data: row, errors }, parser) => {
            lineNumber += 1;

            if (row.filter((f) => f.trim()).length === 0) {
              emptyLines += 1;
              return;
            }

            if ((lineNumber - emptyLines) > readLimit) {
              parser.abort();
              return;
            }

            if (errors.length > 0) {
              // eslint-disable-next-line prefer-destructuring
              err = errors[0];

              if (err.type === 'Quotes') {
                err.message = this.$t('files.markFieldIncorrectlyFormatted', { lineNumber });
              }

              parser.abort();
              return;
            }

            if (typeof columns === 'undefined') {
              columns = row;

              const missingField = mandatoryFields.find((field) => !columns.includes(field));

              if (missingField) {
                err = new Error(this.$t('files.missingField', { missingField }));
                parser.abort();
              }
              return;
            }

            const obj = {};

            columns.forEach((colName, index) => {
              obj[colName] = row[index];
            });

            if (!obj.log_id) {
              err = new Error(this.$t('files.fieldIsEmpty', { lineNumber, field: 'log_id' }));
            } else if (!obj.datetime) {
              err = new Error(this.$t('files.fieldIsEmpty', { lineNumber, field: 'datetime' }));
            } else if (Number.isNaN(Date.parse(obj.datetime))) {
              err = new Error(this.$t('files.invalidField', { lineNumber, field: 'datetime' }));
            } else if (obj.date && !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) {
              err = new Error(this.$t('files.fieldIsEmpty', { lineNumber, field: 'date' }));
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
      this.uploads = this.uploads.filter((upload) => upload.id !== id);
    },

    clearCompletedUploads() {
      this.uploads = this.uploads.filter((u) => !u.done);
    },
  },
};
</script>
