<template>
  <v-dialog v-model="show" width="700">
    <v-card>
      <v-card-title v-if="sushiForm.id" class="headline" v-text="formTitle" />
      <v-card-title v-else class="headline" v-text="$t('institutions.sushi.addCredentials')" />

      <v-card-text>
        <v-form id="sushiForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-autocomplete
            ref="endpointsBox"
            v-model="endpoint"
            :items="endpoints"
            :label="`${$t('institutions.sushi.endpoint')} *`"
            :rules="[v => !!v || $t('institutions.sushi.pleaseSelectEndpoint')]"
            item-text="vendor"
            clearable
            outlined
            required
            autofocus
            return-object
            @change="onEndpointChange"
          >
            <template v-slot:item="{ item }">
              <v-list-item-content>
                <v-list-item-title v-text="item.vendor" />
                <v-list-item-subtitle>
                  <template v-if="Array.isArray(item.tags)">
                    <v-chip
                      v-for="(tag, index) in item.tags"
                      :key="index"
                      label
                      x-small
                      color="accent"
                      outlined
                      class="mr-1"
                    >
                      {{ tag }}
                    </v-chip>
                  </template>
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>

            <template v-slot:no-data>
              <v-list-item to="/contact-us">
                <v-list-item-avatar>
                  <v-icon>
                    mdi-plus-circle-outline
                  </v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ $t('endpoints.noEndpointFound') }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $t('endpoints.clickToDeclareOne') }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-autocomplete>

          <v-text-field
            :value="sushiUrl"
            :label="$t('institutions.sushi.sushiUrl')"
            outlined
            readonly
            disabled
          />

          <v-text-field
            v-model="sushiForm.vendor"
            :label="`${$t('institutions.sushi.label')} *`"
            :rules="[v => !!v || $t('institutions.sushi.enterLabel')]"
            outlined
            required
          />

          <v-text-field
            v-model="sushiForm.package"
            :label="`${$t('institutions.sushi.package')} *`"
            :rules="[v => !!v || $t('institutions.sushi.enterPackage')]"
            outlined
            required
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="sushiForm.requestorId"
                :label="$t('institutions.sushi.requestorId')"
                :hint="requireRequestorId ? $t('institutions.sushi.necessaryField') : null"
                :persistent-hint="requireRequestorId && !sushiForm.requestorId"
                outlined
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="sushiForm.customerId"
                :label="$t('institutions.sushi.customerId')"
                :hint="requireCustomerId ? $t('institutions.sushi.necessaryField') : null"
                :persistent-hint="requireCustomerId && !sushiForm.customerId"
                outlined
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model="sushiForm.apiKey"
            :label="$t('institutions.sushi.apiKey')"
            :hint="requireApiKey ? $t('institutions.sushi.necessaryField') : null"
            :persistent-hint="requireApiKey && !sushiForm.apiKey"
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

            <SushiParam
              v-for="(param, index) in sushiForm.params"
              :key="`s-param-${index}`"
              v-model="sushiForm.params[index]"
              class="my-2"
              @remove="removeParam(index)"
            />

            <SushiParam
              v-for="(param, index) in endpointParams"
              :key="`e-param-${index}`"
              v-model="endpointParams[index]"
              :top-text="$t('sushi.unchangeableParam')"
              class="my-2"
              readonly
            />
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
import SushiParam from '~/components/SushiParam';

export default {
  components: {
    SushiParam,
  },
  props: {
    endpoints: {
      type: Array,
      default: () => ([]),
    },
  },
  data() {
    return {
      show: false,
      saving: false,
      institutionId: null,
      valid: false,
      endpoint: null,
      formTitle: '',

      sushiForm: {
        vendor: '',
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
    editMode() { return !!this.sushiForm.id; },
    sushiUrl() { return this.endpoint?.sushiUrl; },
    endpointParams() { return Array.isArray(this.endpoint?.params) ? this.endpoint?.params : []; },
    requireCustomerId() { return this.endpoint?.requireCustomerId; },
    requireRequestorId() { return this.endpoint?.requireRequestorId; },
    requireApiKey() { return this.endpoint?.requireApiKey; },
    requestorIdLabel() {
      return `${this.$t('institutions.sushi.requestorId')} ${this.requireRequestorId ? '*' : ''}`;
    },
    customerIdLabel() {
      return `${this.$t('institutions.sushi.customerId')} ${this.requireCustomerId ? '*' : ''}`;
    },
    apiKeyLabel() {
      return `${this.$t('institutions.sushi.apiKey')} ${this.requireApiKey ? '*' : ''}`;
    },
  },
  methods: {
    editSushiItem(institution, sushiData = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institutionId = institution?.id;
      this.sushiForm.vendor = sushiData.vendor || '';
      this.sushiForm.package = sushiData.package || institution?.indexPrefix || '';
      this.sushiForm.requestorId = sushiData.requestorId || '';
      this.sushiForm.customerId = sushiData.customerId || '';
      this.sushiForm.apiKey = sushiData.apiKey || '';
      this.sushiForm.comment = sushiData.comment || '';
      this.sushiForm.params = sushiData.params;
      this.sushiForm.id = sushiData.id;

      if (!Array.isArray(this.sushiForm.params)) {
        this.sushiForm.params = [];
      }

      this.endpoint = this.endpoints.find(endpoint => endpoint?.id === sushiData?.endpointId);
      this.formTitle = this.sushiForm.vendor;
      this.show = true;
    },

    createSushiItem(institution) {
      this.editSushiItem(institution);
    },

    onEndpointChange() {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      if (this.endpoint?.vendor) {
        this.sushiForm.vendor = this.endpoint.vendor;
      }

      // workaround to hide vendors list on change
      this.$refs.endpointsBox.isMenuActive = false;
    },

    addParam() {
      this.sushiForm.params.unshift({ name: '', value: '', scope: 'all' });
    },

    removeParam(index) {
      this.$delete(this.sushiForm.params, index);
    },

    async save() {
      this.saving = true;

      this.sushiForm.params = this.sushiForm.params.filter(param => param.name);

      try {
        if (this.sushiForm.id) {
          await this.$axios.$patch(`/sushi/${this.sushiForm.id}`, {
            ...this.sushiForm,
            endpointId: this.endpoint?.id,
          });
        } else {
          await this.$axios.$post('/sushi', {
            ...this.sushiForm,
            institutionId: this.institutionId,
            endpointId: this.endpoint?.id,
          });
          this.show = false;
        }
        this.$emit('update');
      } catch (e) {
        const message = [e?.response?.data?.error || this.$t('formSendingFailed')];
        const detail = e?.response?.data?.detail;

        if (detail) {
          message.push(this.$t('reason', { reason: detail }));
        }

        this.$store.dispatch('snacks/error', message);
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
