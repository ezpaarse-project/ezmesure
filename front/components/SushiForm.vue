<template>
  <v-dialog v-model="show" width="700">
    <v-card>
      <v-card-title class="headline">
        {{ formTitle }}
      </v-card-title>

      <v-card-text>
        <v-form id="sushiForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-autocomplete
            ref="endpointsBox"
            v-model="endpoint"
            :items="availableEndpoints"
            :label="`${$t('institutions.sushi.endpoint')} *`"
            :rules="[v => !!v || $t('institutions.sushi.pleaseSelectEndpoint')]"
            item-text="vendor"
            :search-input.sync="endpointSearch"
            :loading="loadingEndpoints"
            :hide-no-data="!endpointSearch"
            clearable
            outlined
            required
            autofocus
            return-object
            @change="onEndpointChange"
          >
            <template #item="{ item }">
              <v-list-item-content>
                <v-list-item-title>
                  {{ item.vendor }}
                </v-list-item-title>

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

            <template #no-data>
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

          <v-combobox
            v-model="sushiForm.tags"
            :items="availableTags"
            :hint="$t('institutions.sushi.tagsDescription')"
            item-text="name"
            hide-selected
            return-object
            hide-no-data
            multiple
            small-chips
            deletable-chips
            persistent-hint
            outlined
          >
            <template #label>
              {{ $t('institutions.sushi.tags') }}

              <v-tooltip top>
                <template #activator="{ on, attrs }">
                  <v-icon
                    small
                    v-bind="attrs"
                    v-on="on"
                  >
                    mdi-help-circle
                  </v-icon>
                </template>
                <span>{{ $t('institutions.sushi.tagsHint') }}</span>
              </v-tooltip>
            </template>
          </v-combobox>

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="sushiForm.requestorId"
                :label="requestorIdLabel"
                :hint="requireRequestorId ? $t('institutions.sushi.necessaryField') : null"
                :persistent-hint="requireRequestorId && !sushiForm.requestorId"
                outlined
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="sushiForm.customerId"
                :label="customerIdLabel"
                :hint="requireCustomerId ? $t('institutions.sushi.necessaryField') : null"
                :persistent-hint="requireCustomerId && !sushiForm.customerId"
                outlined
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model="sushiForm.apiKey"
            :label="apiKeyLabel"
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
            <p>
              {{ $t('institutions.sushi.pleaseEnterParams') }}
            </p>

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
              :value="endpointParams[index]"
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
        >
          {{ editMode ? $t('update') : $t('add') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import debounce from 'lodash.debounce';
import SushiParam from '~/components/SushiParam.vue';

export default {
  components: {
    SushiParam,
  },
  props: {
    availableTags: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      show: false,
      saving: false,
      institutionId: null,
      valid: false,
      availableEndpoints: [],
      endpoint: null,
      endpointSearch: '',
      loadingEndpoints: false,

      sushiForm: {
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
    formTitle() {
      return this.sushiForm.id
        ? this.$t('institutions.sushi.updateCredentials')
        : this.$t('institutions.sushi.addCredentials');
    },
  },
  watch: {
    endpointSearch(newValue) {
      if (newValue) {
        this.queryEndpoints(newValue);
      }
    },
  },
  methods: {
    editSushiItem(institution, sushiData = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institutionId = institution?.id;
      this.sushiForm.tags = Array.isArray(sushiData.tags) ? sushiData.tags : [];
      this.sushiForm.requestorId = sushiData.requestorId || '';
      this.sushiForm.customerId = sushiData.customerId || '';
      this.sushiForm.apiKey = sushiData.apiKey || '';
      this.sushiForm.comment = sushiData.comment || '';
      this.sushiForm.params = sushiData.params;
      this.sushiForm.id = sushiData.id;

      if (!Array.isArray(this.sushiForm.params)) {
        this.sushiForm.params = [];
      }

      this.endpoint = sushiData.endpoint;
      this.availableEndpoints = [sushiData.endpoint];
      this.show = true;
    },

    createSushiItem(institution) {
      this.editSushiItem(institution);
    },

    onEndpointChange() {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
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

    queryEndpoints: debounce(async function queryEndpoints() {
      this.loadingEndpoints = true;
      try {
        this.availableEndpoints = await this.$axios.$get('/sushi-endpoints', { params: { q: this.endpointSearch } });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.unableToRetrivePlatforms'));
      }
      this.loadingEndpoints = false;
    }, 500),

    async save() {
      this.saving = true;

      this.sushiForm.params = this.sushiForm.params.filter((param) => param.name);

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

      this.saving = false;
      this.show = false;
    },
  },
};
</script>
