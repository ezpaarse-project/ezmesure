<template>
  <v-menu
    :close-on-content-click="false"
    transition="slide-y-transition"
    max-width="35%"
    open-on-hover
    bottom
    offset-y
  >
    <template #activator="{ on }">
      <v-icon :color="hasRequiredError ? 'error' : ''" v-on="on">
        {{ item.active ? 'mdi-key' : 'mdi-key-outline' }}
      </v-icon>
    </template>

    <v-simple-table>
      <tbody>
        <tr v-if="!item.active" class="red--text">
          <td colspan="3" class="pa-0">
            <v-alert type="warning" text dense class="mb-0">
              <div class="text-h6">
                {{ $t('sushi.inactive') }}
              </div>

              {{ $t('sushi.inactiveDescription') }}
            </v-alert>
          </td>
        </tr>
        <tr v-if="item.requestorId || endpoint.requireRequestorId">
          <td>
            <v-icon :color="!item.requestorId ? 'error' : ''">
              mdi-account-arrow-down
            </v-icon>
          </td>
          <td class="font-weight-bold">
            {{ $t('institutions.sushi.requestorId') }}
          </td>
          <td>
            {{ item.requestorId }}
          </td>
        </tr>

        <tr v-if="item.customerId || endpoint.requireCustomerId">
          <td>
            <v-icon :color="!item.customerId ? 'error' : ''">
              mdi-account
            </v-icon>
          </td>
          <td class="font-weight-bold">
            {{ $t('institutions.sushi.customerId') }}
          </td>
          <td>{{ item.customerId }}</td>
        </tr>

        <tr v-if="item.apiKey || endpoint.requireApiKey">
          <td>
            <v-icon :color="!item.apiKey ? 'error' : ''">
              mdi-key-variant
            </v-icon>
          </td>
          <td class="font-weight-bold">
            {{ $t('institutions.sushi.apiKey') }}
          </td>
          <td>{{ item.apiKey }}</td>
        </tr>

        <tr v-for="param in item.params" :key="param.name">
          <td class="font-italic">
            {{ param.scope }}
          </td>
          <td>{{ param.name }}</td>
          <td>{{ param.value }}</td>
        </tr>
      </tbody>
    </v-simple-table>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  endpoint: {
    type: Object,
    required: true,
  },
});

const hasRequiredError = computed(
  () => (!props.item.requestorId && props.endpoint.requireRequestorId)
  || (!props.item.customerId && props.endpoint.requireCustomerId)
  || (!props.item.apiKey && props.endpoint.requireApiKey),
);
</script>
