<template>
  <v-dialog v-model="show" width="700">
    <v-card>
      <v-card-title class="headline" v-text="sushiForm.vendor" />

      <v-card-text>
        <v-form id="sushiForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-combobox
            ref="vendorsBox"
            v-model="sushiForm.vendor"
            :items="vendors"
            :label="`${$t('institutions.sushi.platform')} *`"
            :rules="[v => !!v || $t('institutions.sushi.enterLabel')]"
            item-text="vendor"
            outlined
            required
            autofocus
            @change="onVendorChange"
          />

          <v-text-field
            v-model="sushiForm.package"
            :label="`${$t('institutions.sushi.package')} *`"
            :rules="[v => !!v || $t('institutions.sushi.enterPackage')]"
            outlined
            required
          />

          <v-text-field
            v-model="sushiForm.sushiUrl"
            :label="`${$t('institutions.sushi.sushiUrl')} *`"
            :rules="[v => !!v || $t('institutions.sushi.enterUrl')]"
            :disabled="!canEditSushiUrl"
            outlined
            required
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="sushiForm.requestorId"
                :label="$t('institutions.sushi.requestorId')"
                :hint="platform.requestorId ? $t('institutions.sushi.necessaryField') : null"
                :persistent-hint="platform.requestorId && !sushiForm.requestorId"
                outlined
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="sushiForm.customerId"
                :label="$t('institutions.sushi.customerId')"
                :hint="platform.customerId ? $t('institutions.sushi.necessaryField') : null"
                :persistent-hint="platform.customerId && !sushiForm.customerId"
                outlined
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model="sushiForm.apiKey"
            :label="$t('institutions.sushi.apiKey')"
            :hint="platform.apiKey ? $t('institutions.sushi.necessaryField') : null"
            :persistent-hint="platform.apiKey && !sushiForm.apiKey"
            outlined
          />

          <v-textarea
            v-model="sushiForm.comment"
            :label="$t('institutions.sushi.comment')"
            outlined
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-expansion-panels flat tile>
        <v-expansion-panel>
          <v-expansion-panel-header>
            {{ $t('advancedSettings') }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <p v-text="$t('institutions.sushi.pleaseEnterParams')" />

            <v-btn
              type="submit"
              color="primary"
              class="mb-2"
              small
              outlined
              @click="addParam"
            >
              <v-icon left>
                mdi-plus
              </v-icon>
              {{ $t('add') }}
            </v-btn>

            <template v-for="(param, index) in sushiForm.params">
              <v-row :key="index">
                <v-col>
                  <v-text-field
                    v-model="param.name"
                    :label="$t('name')"
                    hide-details
                    outlined
                    dense
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="param.value"
                    :label="$t('value')"
                    hide-details
                    outlined
                    dense
                  />
                </v-col>

                <v-col class="shrink">
                  <v-btn icon @click="removeParam(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
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
      platform: {},

      sushiForm: {
        vendor: '',
        sushiUrl: '',
        requestorId: '',
        customerId: '',
        apiKey: '',
        comment: '',
        id: null,
        params: [],
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
    requestorIdLabel() {
      return `${this.$t('institutions.sushi.requestorId')} ${this.platform?.requestorId ? '*' : ''}`;
    },
    customerIdLabel() {
      return `${this.$t('institutions.sushi.customerId')} ${this.platform?.customerId ? '*' : ''}`;
    },
    apiKeyLabel() {
      return `${this.$t('institutions.sushi.apiKey')} ${this.platform?.apiKey ? '*' : ''}`;
    },
  },
  methods: {
    editSushiItem(institution, sushiData = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institutionId = institution?.id;
      this.sushiForm.vendor = sushiData.vendor || '';

      this.applyVendor();

      this.sushiForm.package = sushiData.package || institution?.indexPrefix || '';
      this.sushiForm.sushiUrl = sushiData.sushiUrl || '';
      this.sushiForm.requestorId = sushiData.requestorId || '';
      this.sushiForm.customerId = sushiData.customerId || '';
      this.sushiForm.apiKey = sushiData.apiKey || '';
      this.sushiForm.comment = sushiData.comment || '';
      this.sushiForm.params = sushiData.params;
      this.sushiForm.id = sushiData.id;

      if (!Array.isArray(this.sushiForm.params)) {
        this.sushiForm.params = [];
      }

      this.show = true;
    },

    createSushiItem(institution) {
      this.editSushiItem(institution);
    },

    applyVendor() {
      const vendor = this.sushiForm.vendor?.toLowerCase();
      this.platform = this.platforms.find(p => p.vendor.toLowerCase() === vendor) || {};

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

    addParam() {
      this.sushiForm.params.unshift({ name: '', value: '' });
    },

    removeParam(index) {
      this.$delete(this.sushiForm.params, index);
    },

    async save() {
      this.saving = true;

      this.sushiForm.params = this.sushiForm.params.filter(param => param.name);

      try {
        if (this.sushiForm.id) {
          await this.$axios.$patch(`/sushi/${this.sushiForm.id}`, this.sushiForm);
        } else {
          await this.$axios.$post('/sushi', { ...this.sushiForm, institutionId: this.institutionId });
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
