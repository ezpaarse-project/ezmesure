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
                    :rules="[
                      v => !!v || $t('institutions.sushi.enterUrl')
                    ]"
                    :disabled="!canEditSushiUrl"
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="sushiForm.requestorId"
                    :label="`Requestor Id ${(platform.requestorId ? '*' : '')}`"
                    :rules="platform.requestorId ? [rules.requestorId] : []"
                    :required="platform.requestorId"
                    outlined
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="sushiForm.customerId"
                    :label="`Customer Id ${(platform.customerId ? '*' : '')}`"
                    :rules="platform.customerId ? [rules.customerId] : []"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="sushiForm.apiKey"
                    :label="`API Key ${(platform.apiKey ? '*' : '')}`"
                    :rules="platform.apiKey ? [rules.apiKey] : []"
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
  },
  data() {
    return {
      show: false,
      saving: false,
      institutionId: null,
      canEditSushiUrl: false,
      valid: false,
      platform: null,

      sushiForm: {
        vendor: '',
        sushiUrl: '',
        requestorId: '',
        customerId: '',
        apiKey: '',
        comment: '',
        id: null,
      },

      rules: {
        requestorId: v => !!v || this.$t('institutions.sushi.enterRequestorId'),
        customerId: v => !!v || this.$t('institutions.sushi.enterCustomerId'),
        apiKey: v => !!v || this.$t('institutions.sushi.enterAPIKey'),
      },
    };
  },
  computed: {
    editMode() {
      return !!this.sushiForm.id;
    },
    vendors() {
      return this.platforms.map(p => p.vendor);
    },
  },
  methods: {
    editSushiItem(institutionId, sushiData = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institutionId = institutionId;
      this.sushiForm.vendor = sushiData.vendor || '';

      this.applyVendor();

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

    applyVendor() {
      const vendor = this.sushiForm.vendor?.toLowerCase();
      this.platform = this.platforms.find(p => p.vendor.toLowerCase() === vendor);

      this.sushiForm.sushiUrl = this.platform?.sushiUrl || '';
      this.canEditSushiUrl = !this.platform?.sushiUrl;
    },

    onVendorChange() {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.applyVendor();

      // workaround to hide vendors list on change
      this.$refs.vendorsBox.isMenuActive = false;
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
