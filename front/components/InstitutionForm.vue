<template>
  <v-dialog v-model="show" scrollable width="900">
    <v-card>
      <v-card-title class="headline">
        {{ $t(editMode ? 'institutions.updateInstitution' : 'institutions.newInstitution') }}
      </v-card-title>

      <v-card-text>
        <v-row align="center">
          <v-col class="grow">
            <OpenDataSearch v-model="openData" />
          </v-col>
          <v-col class="shrink">
            <v-btn color="primary" :disabled="!openData" @click="applyOpenDataData">
              {{ $t('apply') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-form id="institutionForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.name"
                :label="$t('institutions.institution.title')"
                hide-details
                outlined
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
                v-model="institution.website"
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

          <v-divider />

          <v-row>
            <v-col cols="12">
              <span class="subtitle-1">{{ $t('institutions.institution.automations') }} :</span>
            </v-col>
            <v-col cols="4">
              <v-checkbox v-model="institution.auto.ezpaarse" label="ezPAARSE" />
            </v-col>
            <v-col cols="4">
              <v-checkbox v-model="institution.auto.ezmesure" label="ezMESURE" />
            </v-col>
            <v-col cols="4">
              <v-checkbox v-model="institution.auto.report" label="Reporting" />
            </v-col>
          </v-row>

          <v-divider />

          <v-row v-if="isAdmin">
            <v-col cols="12">
              <span class="subtitle-1">{{ $t('administration') }}</span>
            </v-col>

            <v-col cols="12">
              <v-checkbox
                v-model="identicalNames"
                :label="$t('institutions.institution.identicalNames')"
                hide-details
                @change="duplicatePrefix"
              />
            </v-col>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="institution.indexPrefix"
                :label="$t('institutions.institution.associatedIndex')"
                :rules="indexPrefixRules"
                outlined
                @input="duplicatePrefix"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="institution.role"
                :label="$t('institutions.institution.associatedRole')"
                :disabled="identicalNames"
                outlined
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="institution.space"
                :label="$t('institutions.institution.associatedSpace')"
                :disabled="identicalNames"
                outlined
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false" v-text="$t('close')" />

        <v-btn
          type="submit"
          form="institutionForm"
          color="primary"
          text
          :disabled="!valid"
          :loading="saving"
          v-text="editMode ? $t('update') : $t('create')"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import OpenDataSearch from '~/components/OpenDataSearch';

const defaultLogo = require('@/static/images/logo-etab.png');

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = () => resolve(btoa(reader.result));
  reader.onerror = error => reject(error);
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
      saveCreator: false,

      openData: null,

      hoverLogo: false,
      draggingFile: false,
      defaultLogo,
      logoPreview: null,
      identicalNames: true,

      institution: {
        auto: {},
      },

      indexPrefixRules: [
        (value) => {
          const pattern = /^[a-z0-9][a-z0-9_.-]*$/;

          if (value === '' || pattern.test(value)) {
            return true;
          }
          return this.$t('institutions.institution.mustMatch', { pattern: pattern.toString() });
        },
      ],
    };
  },
  computed: {
    editMode() {
      return !!this.institution.id;
    },
    vendors() {
      return this.platforms.map(p => p.vendor);
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
      if (this.hasRoles) {
        return this.$auth.user.roles.some(role => ['admin', 'superuser'].includes(role));
      }
      return false;
    },
  },
  methods: {
    duplicatePrefix() {
      if (this.identicalNames) {
        this.institution.space = this.institution.indexPrefix;
        this.institution.role = this.institution.indexPrefix;
      }
    },
    editInstitution(institution) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institution = JSON.parse(JSON.stringify(institution));
      this.institution.auto = this.institution.auto || {};

      const { role, space, indexPrefix } = this.institution;
      this.identicalNames = (role === space && role === indexPrefix);

      this.logoPreview = null;
      this.openData = null;
      this.show = true;
    },

    createInstitution(opts = {}) {
      this.editInstitution({}, opts);
      this.saveCreator = (opts.saveCreator !== false);
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

    applyOpenDataData() {
      if (!this.openData) { return; }

      if (this.openData.nom) {
        this.$set(this.institution, 'name', this.openData.nom);
      }
      if (this.openData.code_uai) {
        this.$set(this.institution, 'uai', this.openData.code_uai);
      }
      if (this.openData.type_detablissement) {
        this.$set(this.institution, 'type', this.openData.type_detablissement);
      }
      if (this.openData.commune) {
        this.$set(this.institution, 'city', this.openData.commune);
      }
      if (this.openData.sigle) {
        this.$set(this.institution, 'acronym', this.openData.sigle);
      }
    },

    async save() {
      this.saving = true;

      try {
        if (this.institution.id) {
          await this.$axios.$put(`/institutions/${this.institution.id}`, this.institution);
        } else {
          const params = { creator: this.saveCreator };
          await this.$axios.$post('/institutions', this.institution, { params });
        }
        this.$emit('update');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.institution.unableToUpate'));
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
