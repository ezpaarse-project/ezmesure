<template>
  <v-dialog
    v-model="show"
    scrollable
    persistent
    width="900"
  >
    <v-card>
      <v-card-title class="headline">
        {{ $t(editMode ? 'institutions.updateInstitution' : 'institutions.newInstitution') }}
      </v-card-title>

      <v-card-text>
        <v-row align="center">
          <v-col class="grow">
            <OpenDataSearch
              v-model="openData"
              @input="applyOpenData"
            />
          </v-col>
        </v-row>

        <v-form id="institutionForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-card outlined>
            <v-card-title>
              {{ $t('institutions.institution.general') }}
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.name"
                    :label="`${$t('name')} *`"
                    :rules="[v => !!v || $t('fieldIsRequired')]"
                    hide-details
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.acronym"
                    :label="$t('institutions.institution.acronym')"
                    hide-details
                    outlined
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.websiteUrl"
                    :label="$t('institutions.institution.homepage')"
                    hide-details
                    outlined
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.city"
                    :label="$t('institutions.institution.city')"
                    hide-details
                    outlined
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.type"
                    :label="$t('institutions.institution.type')"
                    hide-details
                    outlined
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.uai"
                    :label="$t('institutions.institution.uai')"
                    :hint="$t('institutions.institution.uaiDescription')"
                    persistent-hint
                    outlined
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card outlined class="mt-4">
            <v-card-title>
              {{ $t('institutions.institution.socialNetworks') }}
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.social.twitterUrl"
                    :label="$t('institutions.institution.twitterUrl')"
                    append-icon="mdi-twitter"
                    hide-details
                    outlined
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.social.linkedinUrl"
                    :label="$t('institutions.institution.linkedinUrl')"
                    append-icon="mdi-linkedin"
                    hide-details
                    outlined
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.social.youtubeUrl"
                    :label="$t('institutions.institution.youtubeUrl')"
                    append-icon="mdi-youtube"
                    hide-details
                    outlined
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="institution.social.facebookUrl"
                    :label="$t('institutions.institution.facebookUrl')"
                    append-icon="mdi-facebook"
                    hide-details
                    outlined
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card outlined class="mt-4">
            <v-card-title>
              {{ $t('institutions.institution.logo') }}
            </v-card-title>
            <v-card-text>
              <v-alert v-model="logoHasError" type="error" dismissible>
                {{ logoErrorMessage }}
              </v-alert>

              <v-hover v-model="hoverLogo" class="mx-auto">
                <template #default="{ hover }">
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
                      accept="image/png, image/jpeg, image/svg+xml"
                      class="d-none"
                      @change="onLogoChange"
                    >

                    <v-fade-transition>
                      <v-overlay v-if="hover" absolute>
                        <div v-if="draggingFile">
                          {{ $t('institutions.institution.dropImageHere') }}
                        </div>

                        <div v-else>
                          <v-btn v-if="logoPreview || institution.logoId" @click="removeLogo">
                            {{ $t('delete') }}
                          </v-btn>

                          <v-btn @click="$refs.logo.click()">
                            {{ $t('modify') }}
                          </v-btn>
                        </div>
                      </v-overlay>
                    </v-fade-transition>
                  </v-card>
                </template>
              </v-hover>
            </v-card-text>
          </v-card>

          <v-card v-if="isAdmin" outlined class="mt-4">
            <v-card-title>
              {{ $t('administration') }}
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="institution.namespace"
                    :label="$t('institutions.institution.namespace')"
                    :hint="$t('institutions.institution.namespaceHint')"
                    :rules="namespaceRules"
                    persistent-hint
                    outlined
                    dense
                  />
                  <v-checkbox
                    v-model="institution.validated"
                    :label="$t('institutions.institution.valid')"
                    hide-details
                    class="mt-0"
                  />
                  <v-checkbox
                    v-model="institution.hidePartner"
                    :label="$t('institutions.institution.hidePartner')"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('cancel') }}
        </v-btn>

        <v-btn
          type="submit"
          form="institutionForm"
          color="primary"
          :disabled="!valid"
          :loading="saving"
        >
          <v-icon left>
            mdi-content-save
          </v-icon>
          {{ editMode ? $t('update') : $t('create') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import OpenDataSearch from '~/components/OpenDataSearch.vue';

const idPattern = /^[a-z0-9][a-z0-9_.-]*$/;
const defaultLogo = require('@/static/images/logo-etab.png');

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const b64 = reader.result.replace(/^data:.*?;base64,/i, '');
    resolve(b64);
  };
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(file);
});

export default {
  components: {
    OpenDataSearch,
  },
  data() {
    return {
      show: false,
      saving: false,
      valid: false,
      addAsMember: false,

      openData: null,

      hoverLogo: false,
      draggingFile: false,
      defaultLogo,
      logoPreview: null,
      identicalNames: true,
      logoErrorMessage: null,
      logoHasError: false,

      institution: {
        social: {},
      },

      namespaceRules: [
        (v) => (!v || idPattern.test(v)) || this.$t('fieldMustMatch', { pattern: idPattern.toString() }),
      ],
    };
  },
  computed: {
    editMode() {
      return !!this.institution.id;
    },
    vendors() {
      return this.platforms.map((p) => p.vendor);
    },
    members() {
      const members = this.institution?.contacts;
      return Array.isArray(members) ? members : [];
    },
    logoSrc() {
      if (this.logoPreview) { return this.logoPreview; }
      if (this.institution?.logoId) { return `/api/assets/logos/${this.institution.logoId}`; }
      return defaultLogo;
    },
    hasRoles() {
      return Array.isArray(this.$auth?.user?.roles) && this.$auth.user.roles.length > 0;
    },
    isAdmin() {
      return this.$auth?.user?.isAdmin;
    },
  },
  methods: {
    editInstitution(institution) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institution = JSON.parse(JSON.stringify(institution));
      this.institution.social = this.institution.social || {};

      this.logoPreview = null;
      this.logoHasError = false;
      this.openData = null;
      this.show = true;
    },

    createInstitution(opts = {}) {
      this.editInstitution({}, opts);
      this.addAsMember = (opts.addAsMember !== false);
    },

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
      if (!/\.(jpe?g|png|svg)$/.exec(file.name)) {
        this.logoErrorMessage = this.$t('institutions.institution.invalidImageFile');
        this.logoHasError = true;
        return;
      }

      const maxSize = 2 * 1024 * 1024; // 2mb
      if (file.size > maxSize) {
        this.logoErrorMessage = this.$t('institutions.institution.imageTooLarge');
        this.logoHasError = true;
        return;
      }

      const base64logo = await toBase64(file);
      this.institution.logo = base64logo;
      this.logoPreview = URL.createObjectURL(file);
    },
    removeLogo() {
      this.logoPreview = null;
      this.institution.logo = null;
      this.institution.logoId = null;
    },

    applyOpenData() {
      if (!this.openData) { return; }

      const fields = [
        ['name', 'uo_lib_officiel'],
        ['websiteUrl', 'url'],
        ['uai', 'uai'],
        ['type', 'type_d_etablissement'],
        ['city', 'com_nom'],
        ['acronym', 'sigle'],
      ];

      const socialFields = [
        ['twitterUrl', 'compte_twitter'],
        ['linkedinUrl', 'compte_linkedin'],
        ['youtubeUrl', 'compte_youtube'],
        ['facebookUrl', 'compte_facebook'],
      ];

      fields.forEach(([institutionKey, openDataKey]) => {
        this.$set(this.institution, institutionKey, this.openData[openDataKey] || '');
      });
      socialFields.forEach(([institutionKey, openDataKey]) => {
        this.$set(this.institution.social, institutionKey, this.openData[openDataKey] || '');
      });
    },

    async save() {
      this.saving = true;

      try {
        if (this.institution.id) {
          await this.$axios.$put(`/institutions/${this.institution.id}`, { ...this.institution });
        } else {
          const params = { addAsMember: this.addAsMember };
          await this.$axios.$post('/institutions', this.institution, { params });
        }
        this.$emit('update');
      } catch (e) {
        if (e?.response?.status === 413) {
          this.$store.dispatch('snacks/error', this.$t('institutions.institution.imageTooLarge'));
        } else if (e?.response?.data?.error) {
          this.$store.dispatch('snacks/error', e.response.data.error);
        } else {
          this.$store.dispatch('snacks/error', this.$t('institutions.institution.unableToUpate'));
        }
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', this.$t('institutions.institution.updated'));
      this.saving = false;
      this.show = false;
    },
  },
};
</script>
