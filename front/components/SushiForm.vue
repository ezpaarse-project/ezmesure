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
                  :label="$t('institutions.sushi.platform')"
                  :rules="[v => !!v || $t('institutions.sushi.enterLabel')]"
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
                    :rules="[v => !!v || $t('institutions.sushi.enterPackage')]"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.sushiUrl"
                    :label="$t('institutions.sushi.sushiUrl')"
                    :rules="[v => !!v || $t('institutions.sushi.enterUrl')]"
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
                      requiredFields.requestorId ?
                        !!v || $t('institutions.sushi.enterRequestorId') : !v
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
                      requiredFields.customerId ?
                        !!v || $t('institutions.sushi.enterCustomerId') : !v
                    ]"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.apiKey"
                    :label="`API Key ${(requiredFields.apiKey ? '*' : '')}`"
                    :rules="[v =>
                      requiredFields.apiKey ? !!v || $t('institutions.sushi.enterAPIKey') : !v
                    ]"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="sushiForm.comment"
                    :label="$t('institutions.sushi.comment')"
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
          v-text="editMode ? $t('update') : $t('add')"
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
        requestorId: platform?.requestorId || false,
        customerId: platform?.customerId || false,
        apiKey: platform?.apiKey || false,
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
        this.$store.dispatch('snacks/error', this.$t('formSendingFailed'));
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', this.$t('informationSubmitted'));
      this.saving = false;
      this.show = false;
    },
  },
};
</script>
