<template>
  <v-dialog v-model="show" width="700">
    <v-card>
      <v-card-title class="headline">
        {{ endpointForm.id ? formTitle : $t('endpoints.addEndpoint') }}
      </v-card-title>

      <v-card-text>
        <v-form id="endpointForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-text-field
            v-model="endpointForm.vendor"
            :label="`${$t('endpoints.vendor')} *`"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            outlined
            required
          />

          <v-text-field
            v-model="endpointForm.sushiUrl"
            :label="`${$t('endpoints.url')} *`"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            outlined
            required
            @change="onSushiUrlChange"
          />

          <v-alert
            :value="looksLikeSoapUrl"
            dense
            outlined
            type="warning"
            icon="mdi-alert-outline"
            transition="scale-transition"
          >
            {{ $t('endpoints.soapWarning') }}
          </v-alert>

          <v-combobox
            v-model="endpointForm.tags"
            :items="availableTags"
            :label="$t('endpoints.tags')"
            item-text="name"
            hide-selected
            return-object
            hide-no-data
            multiple
            small-chips
            outlined
          />

          <v-text-field
            v-model="endpointForm.technicalProvider"
            :label="$t('endpoints.technicalProvider')"
            outlined
            required
          />

          <v-row>
            <v-col cols="8">
              <v-combobox
                v-model="endpointForm.testedReport"
                :label="$t('endpoints.testedReport')"
                :items="supportedReports"
                placeholder="pr"
                outlined
              >
                <template #prepend-item>
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>
                        {{ $t('reports.supportedReportsOnPlatform') }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </template>

                <template #no-data>
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title v-if="supportedReportsSearch">
                        <i18n path="noMatchFor">
                          <template #search>
                            <strong>{{ supportedReportsSearch }}</strong>
                          </template>

                          <template #key>
                            <kbd>{{ $t('enterKey') }}</kbd>
                          </template>
                        </i18n>
                      </v-list-item-title>
                      <v-list-item-title v-else>
                        {{ $t('reports.supportedReportsUnavailable') }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </template>
              </v-combobox>
            </v-col>

            <v-col cols="4">
              <v-text-field
                v-model="endpointForm.counterVersion"
                :label="$t('endpoints.counterVersion')"
                :rules="counterVersionRules"
                outlined
                required
              />
            </v-col>
          </v-row>

          <v-textarea
            v-model="endpointForm.description"
            :label="$t('endpoints.description')"
            outlined
          />

          <v-row>
            <v-col cols="6">
              <v-checkbox
                v-model="endpointForm.requireRequestorId"
                :label="$t('endpoints.requireRequestorId')"
                hide-details
                style="flex: 1"
              />
            </v-col>

            <v-col cols="6">
              <v-checkbox
                v-model="endpointForm.requireCustomerId"
                :label="$t('endpoints.requireCustomerId')"
                hide-details
                style="flex: 1"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="6">
              <v-checkbox
                v-model="endpointForm.requireApiKey"
                :label="$t('endpoints.requireApiKey')"
                hide-details
                style="flex: 1"
              />
            </v-col>
            <v-col cols="6">
              <v-checkbox
                v-model="endpointForm.ignoreReportValidation"
                :label="$t('endpoints.ignoreReportValidation')"
                style="flex: 1"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-title>
        {{ $t('endpoints.harvestedReports') }}
      </v-card-title>

      <v-card-text>
        <p>{{ $t('endpoints.ignoredReportsDesc') }}</p>

        <v-combobox
          v-model="endpointForm.ignoredReports"
          :search-input.sync="supportedReportsSearch"
          :items="supportedReports"
          :label="$t('endpoints.ignoredReports')"
          multiple
          small-chips
          deletable-chips
          outlined
        >
          <template #prepend-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-subtitle>
                  {{ $t('reports.supportedReportsOnPlatform') }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>

          <template #no-data>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title v-if="supportedReportsSearch">
                  <i18n path="noMatchFor">
                    <template #search>
                      <strong>{{ supportedReportsSearch }}</strong>
                    </template>

                    <template #key>
                      <kbd>{{ $t('enterKey') }}</kbd>
                    </template>
                  </i18n>
                </v-list-item-title>
                <v-list-item-title v-else>
                  {{ $t('reports.supportedReportsUnavailable') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-combobox>

        <p>{{ $t('endpoints.additionalReportsDesc') }}</p>

        <v-combobox
          v-model="endpointForm.additionalReports"
          :label="$t('endpoints.additionalReports')"
          multiple
          small-chips
          deletable-chips
          outlined
        >
          <template #append>
            <div />
          </template>
        </v-combobox>
      </v-card-text>

      <v-divider />

      <v-card-title>
        {{ $t('endpoints.dateFormat') }}
      </v-card-title>

      <v-card-text>
        <i18n path="endpoints.dateFormatDesc" tag="p">
          <template #beginDate>
            <code>begin_date</code>
          </template>
          <template #endDate>
            <code>end_date</code>
          </template>
        </i18n>

        <v-combobox
          v-model="endpointForm.harvestDateFormat"
          :search-input.sync="harvestDateFormatSearch"
          :items="availableHarvestDateFormats"
          :label="$t('endpoints.dateFormat')"
          hide-no-data
          outlined
        >
          <template v-if="harvestDateFormatSearch" #append>
            <LocalDate
              :format="harvestDateFormatSearch"
              :date="new Date()"
            />
          </template>

          <template #item="{ item }">
            <v-list-item-content>
              <v-list-item-title>{{ item }}</v-list-item-title>
            </v-list-item-content>

            <v-list-item-action>
              <v-list-item-action-text>
                <LocalDate
                  :format="item"
                  :date="new Date()"
                />
              </v-list-item-action-text>
            </v-list-item-action>
          </template>
        </v-combobox>
      </v-card-text>

      <v-divider />

      <v-card-title>
        {{ $t('endpoints.queryParameters') }}
      </v-card-title>

      <v-card-text>
        <i18n path="endpoints.paramSeparatorDesc" tag="p" class="text-justify">
          <template #0>
            <code>Attributes_To_Show</code>
          </template>

          <template #1>
            <code>Access_Type</code>
          </template>

          <template #2>
            <code>Section_Type</code>
          </template>

          <template #separator>
            <code>|</code>
          </template>
        </i18n>

        <v-text-field
          v-model="endpointForm.paramSeparator"
          :label="$t('endpoints.paramSeparator')"
          dense
          outlined
          required
        />

        <p>
          {{ $t('endpoints.pleaseEnterParams') }}
        </p>

        <v-btn
          type="submit"
          color="primary"
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
          v-for="(param, index) in endpointForm.params"
          :key="index"
          v-model="endpointForm.params[index]"
          class="my-2"
          @remove="removeParam(index)"
        />
      </v-card-text>

      <v-card-actions>
        <EndpointTestMenu :endpoint="endpointForm" />

        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
        </v-btn>

        <v-btn
          type="submit"
          form="endpointForm"
          color="primary"
          text
          :disabled="!valid"
          :loading="saving"
        >
          {{ editMode ? $t('update') : $t('add') }}
        </v-btn>
      </v-card-actions>

      <ConfirmDialog ref="confirm" />
    </v-card>
  </v-dialog>
</template>

<script>
import ConfirmDialog from '~/components/ConfirmDialog.vue';
import SushiParam from '~/components/SushiParam.vue';
import LocalDate from '~/components/LocalDate.vue';
import EndpointTestMenu from '~/components/endpoints/EndpointTestMenu.vue';

export default {
  components: {
    ConfirmDialog,
    SushiParam,
    LocalDate,
    EndpointTestMenu,
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
      valid: false,
      formTitle: '',
      supportedReportsSearch: '',
      harvestDateFormatSearch: '',

      supportedReports: [],

      endpointForm: {
        id: null,
        params: [],
        tags: [],
        ignoredReports: [],
        additionalReports: [],
        vendor: '',
        sushiUrl: '',
        description: '',
        technicalProvider: '',
        counterVersion: '',
        paramSeparator: '',
        testedReport: '',
        harvestDateFormat: '',
        requireCustomerId: false,
        requireRequestorId: false,
        requireApiKey: false,
        ignoreReportValidation: false,
      },

      availableHarvestDateFormats: [
        'yyyy-MM',
        'yyyy-MM-dd',
      ],

      counterVersionRules: [
        (value) => {
          const pattern = /^[0-9]+(\.[0-9]+(\.[0-9]+)?)?$/;

          if (value === '' || pattern.test(value)) {
            return true;
          }
          return this.$t('fieldMustMatch', { pattern: pattern.toString() });
        },
      ],
    };
  },
  computed: {
    editMode() { return !!this.endpointForm.id; },
    looksLikeSoapUrl() {
      if (typeof this.endpointForm?.sushiUrl !== 'string') { return false; }
      return this.endpointForm?.sushiUrl.toLowerCase().includes('soap');
    },
  },
  methods: {
    editEndpoint(data = {}) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.supportedReports = Array.isArray(data.supportedReports) ? data.supportedReports : [];

      this.endpointForm.id = data.id;
      this.endpointForm.params = Array.isArray(data.params) ? data.params : [];
      this.endpointForm.tags = Array.isArray(data.tags) ? data.tags : [];
      this.endpointForm.ignoredReports = (
        Array.isArray(data.ignoredReports) ? data.ignoredReports : []
      );
      this.endpointForm.additionalReports = (
        Array.isArray(data.additionalReports) ? data.additionalReports : []
      );

      this.endpointForm.vendor = data.vendor || '';
      this.endpointForm.sushiUrl = data.sushiUrl || '';
      this.endpointForm.description = data.description || '';
      this.endpointForm.technicalProvider = data.technicalProvider || '';
      this.endpointForm.counterVersion = data.counterVersion || '';
      this.endpointForm.paramSeparator = data.paramSeparator || '';
      this.endpointForm.testedReport = data.testedReport || '';
      this.endpointForm.harvestDateFormat = data.harvestDateFormat || '';

      this.endpointForm.requireCustomerId = !!data.requireCustomerId;
      this.endpointForm.requireRequestorId = !!data.requireRequestorId;
      this.endpointForm.requireApiKey = !!data.requireApiKey;
      this.endpointForm.ignoreReportValidation = !!data.ignoreReportValidation;

      this.formTitle = this.endpointForm.vendor;
      this.show = true;
    },

    createEndpoint() {
      this.editEndpoint();
    },

    async onSushiUrlChange() {
      const sushiUrl = this.endpointForm?.sushiUrl;
      const checkReg = /\/(status|members|reports).*/i;

      if (checkReg.test(sushiUrl)) {
        const fixUrl = await this.$refs.confirm.open({
          title: this.$t('areYouSure'),
          message: this.$t('endpoints.sushiNotRootDetected'),
          agreeText: this.$t('fixIt'),
          disagreeText: this.$t('leaveIt'),
        });

        if (fixUrl) {
          this.endpointForm.sushiUrl = sushiUrl.replace(checkReg, '');
        }
      }
    },

    addParam() {
      this.endpointForm.params.unshift({ name: '', value: '', scope: 'all' });
    },

    removeParam(index) {
      this.$delete(this.endpointForm.params, index);
    },

    async save() {
      this.saving = true;

      this.endpointForm.params = this.endpointForm.params.filter((param) => param.name);

      /**
       * Workaround
       * Combobox sets model to null when the input is cleared, and null is ignored by the API
       */
      this.endpointForm.testedReport = this.endpointForm.testedReport || '';
      this.endpointForm.harvestDateFormat = this.endpointForm.harvestDateFormat || '';

      try {
        if (this.endpointForm.id) {
          await this.$axios.$patch(`/sushi-endpoints/${this.endpointForm.id}`, {
            ...this.endpointForm,
            endpointId: this.endpoint?.id,
          });
        } else {
          await this.$axios.$post('/sushi-endpoints', { ...this.endpointForm });
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
