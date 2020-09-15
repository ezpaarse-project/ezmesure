<template>
  <v-dialog v-model="show" scrollable width="900">
    <v-card>
      <v-card-title class="headline">
        {{ $t(editMode ? 'institutions.updateInstitution' : 'institutions.newInstitution') }}
      </v-card-title>

      <v-card-text>
        <v-form id="institutionForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-container class="pa-0">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.name"
                  :label="$t('institutions.institution.title')"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.acronym"
                  :label="$t('institutions.institution.acronym')"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.website"
                  :label="$t('institutions.institution.homepage')"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.city"
                  :label="$t('institutions.institution.city')"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.type"
                  :label="$t('institutions.institution.type')"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.uai"
                  :label="$t('institutions.institution.uai')"
                  :hint="$t('institutions.institution.uaiDescription')"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" sm="12">
                <v-combobox
                  v-model="institution.domains"
                  :label="$t('institutions.institution.domains')"
                  multiple
                  small-chips
                  hide-details
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
                <span class="subtitle-1">Index :</span>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.indexPrefix"
                  label="Index"
                  :hint="suggestedPrefix && `Suggestion : ${suggestedPrefix}`"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.indexCount"
                  label="Total ECs"
                  hide-details
                  disabled
                />
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
          </v-container>
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
const defaultLogo = require('@/static/images/logo-etab.png');

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = () => resolve(btoa(reader.result));
  reader.onerror = error => reject(error);
});

export default {
  data() {
    return {
      show: false,
      saving: false,
      valid: false,

      hoverLogo: false,
      draggingFile: false,
      defaultLogo,
      logoPreview: null,

      institution: {
        auto: {},
      },
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
    suggestedPrefix() {
      const email = this.members[0]?.email;
      const match = /@(\w+)/i.exec(email);
      return match && match[1];
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
    editInstitution(institution) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institution = JSON.parse(JSON.stringify(institution));
      this.institution.auto = this.institution.auto || {};

      this.show = true;
    },

    createInstitution() {
      this.editInstitution({});
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

    async save() {
      this.saving = true;

      try {
        if (this.institution.id) {
          await this.$axios.$put(`/institutions/${this.institution.id}`, this.institution);
        } else {
          await this.$axios.$post('/institutions', this.institution);
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
