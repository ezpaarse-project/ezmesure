<template>
  <div v-if="show" class="d-flex flex-column" style="height: 100%;">
    <v-row v-if="error">
      <v-col>
        <v-alert :text="errorMessage" type="error" rounded="0" />
      </v-col>
    </v-row>

    <v-container class="fill-height">
      <v-row v-if="loading">
        <v-progress-circular
          size="64"
          color="primary"
          indeterminate
          class="mx-auto"
        />
      </v-row>
      <v-row v-else>
        <v-col>
          <v-empty-state
            icon="mdi-emoticon-sad-outline"
            :title="$t('errors.generic')"
            :text="$te(`errors.${error.statusCode}`) ? $t(`errors.${error.statusCode}`) : error.statusMessage"
            :action-text="showRefresh ? $t('refresh') : undefined"
            @click:action="$emit('click:refresh')"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  showRefresh: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: undefined,
  },
  error: {
    type: [Object, String],
    default: undefined,
  },
});

defineEmits({
  'click:refresh': () => true,
});

const errorMessage = computed(() => getErrorMessage(props.error));
</script>
