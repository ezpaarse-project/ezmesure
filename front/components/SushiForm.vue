<template>
  <v-dialog v-model="show" width="600">
    <v-card>
      <v-card-title class="headline" v-text="sushiForm.vendor" />

      <v-card-text>
        <v-form id="sushiForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-combobox
                  ref="vendorsBox"
                  v-model="sushiForm.vendor"
                  :items="vendors"
                  label="Plateforme *"
                  :rules="[v => !!v || 'Veuillez saisir un libellé.']"
                  item-text="vendor"
                  outlined
                  required
                  autofocus
                  @change="onVendorChange"
                />
              </v-col>

              <template v-if="sushiForm.vendor">
                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.package"
                    label="Package *"
                    :rules="[v => !!v || 'Veuillez saisir un package.']"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.sushiUrl"
                    label="URL Sushi *"
                    :rules="[v => !!v || 'Veuillez saisir une url.']"
                    :disabled="!canEditSushiUrl"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="sushiForm.requestorId"
                    :label="`Requestor Id ${(requiredFields.requestorId ? '*' : '')}`"
                    :rules="[v =>
                      requiredFields.requestorId ? !!v || 'Veuillez saisir un Requestor Id.' : !v
                    ]"
                    outlined
                    :required="requiredFields.requestorId"
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="sushiForm.customerId"
                    :label="`Customer Id ${(requiredFields.customerId ? '*' : '')}`"
                    :rules="[v =>
                      requiredFields.customerId ? !!v || 'Veuillez saisir un Customer Id.' : !v
                    ]"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.apiKey"
                    :label="`Clé API ${(requiredFields.apiKey ? '*' : '')}`"
                    :rules="[v =>
                      requiredFields.apiKey ? !!v || 'Veuillez saisir une Clé API.' : !v
                    ]"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="sushiForm.comment"
                    label="Commentaire"
                    outlined
                  />
                </v-col>
              </template>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          Fermer
        </v-btn>

        <v-btn
          type="submit"
          form="sushiForm"
          color="primary"
          text
          :disabled="!valid"
          :loading="saving"
          v-text="editMode ? 'Mettre à jour' : 'Ajouter'"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    platforms: {
      type: Array,
      default: () => ([]),
    },
    vendors: {
      type: Array,
      default: () => ([]),
    },
  },
  data() {
    return {
      show: false,
      saving: false,
      institutionId: null,
      canEditSushiUrl: false,
      valid: false,

      sushiForm: {
        vendor: '',
        sushiUrl: '',
        requestorId: '',
        customerId: '',
        apiKey: '',
        comment: '',
        id: null,
      },

      requiredFields: {},
    };
  },
  computed: {
    editMode() {
      return !!this.sushiForm.id;
    },
  },
  methods: {
    editSushiItem(institutionId, sushiData = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institutionId = institutionId;
      this.sushiForm.vendor = sushiData.vendor || '';
      this.sushiForm.package = sushiData.package || '';
      this.sushiForm.sushiUrl = sushiData.sushiUrl || '';
      this.sushiForm.requestorId = sushiData.requestorId || '';
      this.sushiForm.customerId = sushiData.customerId || '';
      this.sushiForm.apiKey = sushiData.apiKey || '';
      this.sushiForm.comment = sushiData.comment || '';
      this.sushiForm.id = sushiData.id;
      this.show = true;
    },

    createSushiItem(institutionId) {
      this.editSushiItem(institutionId);
    },

    onVendorChange() {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      const vendor = this.sushiForm.vendor?.toLowerCase();
      const platform = this.platforms.find(p => p.vendor.toLowerCase() === vendor);

      this.sushiForm.sushiUrl = platform?.sushiUrl || '';
      this.canEditSushiUrl = !platform?.sushiUrl;

      // workaround to hide vendors list on change
      this.$refs.vendorsBox.isMenuActive = false;

      this.requiredFields = {
        requestorId: platform.requestorId,
        customerId: platform.customerId,
        apiKey: platform.apiKey,
      };
    },

    async save() {
      this.saving = true;

      try {
        if (this.sushiForm.id) {
          await this.$axios.$patch(`/institutions/${this.institutionId}/sushi`, this.sushiForm);
        } else {
          await this.$axios.$post(`/institutions/${this.institutionId}/sushi`, this.sushiForm);
          this.show = false;
        }
        this.$emit('update');
      } catch (e) {
        this.$store.dispatch('snacks/error', 'L\'envoi du formulaire a échoué');
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', 'Informations transmises');
      this.saving = false;
      this.show = false;
    },
  },
};
</script>
