<template>
  <section>
    <ToolBar :title="$t('institutions.institution.title')" />

    <v-card-text v-if="institution">
      <v-form v-model="valid">
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                ref="name"
                v-model="institution.name"
                :label="$t('institutions.institution.name')"
                :placeholder="$t('institutions.institution.nameExample')"
                :rules="[v => !!v || $t('institutions.institution.nameError')]"
                outlined
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.uai"
                :label="$t('institutions.institution.uai')"
                :placeholder="$t('institutions.institution.uaiExample')"
                outlined
                hide-details
              />
              <span class="caption" v-text="$t('institutions.institution.uaiDescription')" />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.website"
                :label="$t('institutions.institution.homepage')"
                :placeholder="$t('institutions.institution.homepageExample')"
                outlined
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.index.prefix"
                :label="$t('institutions.institution.affectedIndex')"
                :placeholder="$t('institutions.institution.affectedIndexExample')"
                outlined
                :hint="suggestedPrefix && `Suggestion : ${suggestedPrefix}`"
              />
            </v-col>

            <v-col cols="12">
              <v-hover v-model="hoverLogo" class="mx-auto">
                <template v-slot:default="{ hover }">
                  <v-card
                    width="320"
                    @dragover.prevent="onDragOver"
                    @dragleave.prevent="onDragLeave"
                    @drop.prevent="onFileDrop"
                  >
                    <v-img
                      contain
                      :src="logoSrc"
                      width="320"
                      height="100"
                    />

                    <v-card-text class="text-center">
                      Logo (ratio 3:1)
                    </v-card-text>

                    <input
                      ref="logo"
                      type="file"
                      accept="image/*"
                      class="d-none"
                      @change="onLogoChange"
                    >

                    <v-fade-transition>
                      <v-overlay v-if="hover" absolute>
                        <div
                          v-if="draggingFile"
                          v-text="$t('institutions.institution.dropImageHere')"
                        />

                        <div v-else>
                          <v-btn
                            v-if="logoPreview || institution.logoId"
                            @click="removeLogo"
                            v-text="$t('delete')"
                          />
                          <v-btn @click="$refs.logo.click()" v-text="$t('modify')" />
                        </div>
                      </v-overlay>
                    </v-fade-transition>
                  </v-card>
                </template>
              </v-hover>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>

    <v-card-actions v-if="institution">
      <span class="caption" v-text="$t('requiredFields')" />
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!valid"
        :loading="loading"
        @click="save"
        v-text="$t('save')"
      />
    </v-card-actions>

    <v-card-text v-else>
      <v-alert
        type="error"
        :value="true"
        v-text="$t('institutions.institution.noDataFound')"
      />
    </v-card-text>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

const defaultLogo = require('@/static/images/logo-etab.png');

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = () => resolve(btoa(reader.result));
  reader.onerror = error => reject(error);
});

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
  },
  async asyncData({ $axios, store, params }) {
    let institution = null;

    try {
      institution = await $axios.$get(`/institutions/${params.id}`);
    } catch (e) {
      if (e.response?.status === 404) {
        institution = {};
      } else {
        store.dispatch('snacks/error', this.$t('institutions.unableToRetriveInformations'));
      }
    }

    if (institution) {
      institution.index = institution.index || {};
    }

    return {
      valid: false,
      hoverLogo: false,
      draggingFile: false,
      defaultLogo,
      logoPreview: null,
      loading: false,
      institution,
    };
  },
  computed: {
    logoSrc() {
      if (this.logoPreview) { return this.logoPreview; }
      if (this.institution?.logoId) { return `/api/assets/logos/${this.institution.logoId}`; }
      return defaultLogo;
    },
    suggestedPrefix() {
      const match = /@(\w+)/i.exec(this.$auth.$state?.user?.email);
      return match && match[1];
    },
  },
  methods: {
    async onLogoChange() {
      this.updateLogo(this.$refs.logo.files[0]);
      this.$refs.logo.value = '';
    },
    onDragOver() {
      this.draggingFile = true;
      this.hoverLogo = true;
    },
    onDragLeave() {
      this.draggingFile = false;
      this.hoverLogo = false;
    },
    onFileDrop(evt) {
      const files = evt?.dataTransfer?.files;
      if (files && files[0]) {
        this.updateLogo(files[0]);
      }
      this.draggingFile = false;
    },
    async updateLogo(file) {
      if (file.type.startsWith('image/')) {
        const base64logo = await toBase64(file);
        this.institution.logo = base64logo;
        this.logoPreview = URL.createObjectURL(file);
      }
    },
    removeLogo() {
      this.logoPreview = null;
      this.institution.logo = null;
      this.institution.logoId = null;
    },
    async save() {
      this.loading = true;

      if (this.institution.id) {
        try {
          await this.$axios.$patch(`/institutions/${this.institution.id}`, this.institution);
        } catch (e) {
          this.$store.dispatch('snacks/error', this.$t('formSendingFailed'));
          this.loading = false;
          return;
        }
        this.$store.dispatch('snacks/success', this.$t('institutions.institution.institutionUpdated'));
      }

      if (!this.institution.id) {
        try {
          await this.$axios.$post('/institutions', this.institution);
        } catch (e) {
          this.$store.dispatch('snacks/error', this.$t('formSendingFailed'));
          this.loading = false;
          return;
        }
        this.$store.dispatch('snacks/success', this.$t('institutions.institution.dataSent'));
      }

      this.loading = false;
    },
  },
};
</script>
