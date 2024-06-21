<template>
  <v-menu :close-on-content-click="false" max-width="500">
    <template #activator="{ on }">
      <v-btn :disabled="!endpoint.sushiUrl" text v-on="on">
        {{ $t('endpoints.checkEndpoint') }}
      </v-btn>
    </template>

    <v-card>
      <v-card-title>
        {{ $t('endpoints.checkEndpoint') }}
      </v-card-title>
      <v-card-text>
        <v-form v-model="valid">
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="sushiForm.requestorId"
                :label="requestorIdLabel"
                :hint="endpoint.requestorId ? $t('institutions.sushi.necessaryField') : null"
                :persistent-hint="endpoint.requestorId && !sushiForm.requestorId"
                outlined
                @input="sushiForm.connection = undefined;"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="sushiForm.customerId"
                :label="customerIdLabel"
                :hint="endpoint.customerId ? $t('institutions.sushi.necessaryField') : null"
                :persistent-hint="endpoint.customerId && !sushiForm.customerId"
                outlined
                @input="sushiForm.connection = undefined;"
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model="sushiForm.apiKey"
            :label="apiKeyLabel"
            :hint="endpoint.apiKey ? $t('institutions.sushi.necessaryField') : null"
            :persistent-hint="endpoint.apiKey && !sushiForm.apiKey"
            outlined
            @input="sushiForm.connection = undefined;"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <CredentialCheckButton
          :sushi="sushiForm"
          :endpoint="endpoint"
          :valid="valid"
          :menu-prop="{ left: true, nudgeWidth: 300 }"
          @update:connection="sushiForm.connection = $event"
        />
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { defineComponent } from 'vue';

import CredentialCheckButton from '~/components/sushis/CredentialCheckButton.vue';

export default defineComponent({
  components: {
    CredentialCheckButton,
  },
  props: {
    endpoint: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    valid: false,
    sushiForm: {
      requestorId: '',
      customerId: '',
      apiKey: '',
      connection: undefined,
    },
  }),
  computed: {
    requestorIdLabel() {
      return `${this.$t('institutions.sushi.requestorId')} ${this.endpoint.requireRequestorId ? '*' : ''}`;
    },
    customerIdLabel() {
      return `${this.$t('institutions.sushi.customerId')} ${this.endpoint.requireCustomerId ? '*' : ''}`;
    },
    apiKeyLabel() {
      return `${this.$t('institutions.sushi.apiKey')} ${this.endpoint.requireApiKey ? '*' : ''}`;
    },
  },
});
</script>
