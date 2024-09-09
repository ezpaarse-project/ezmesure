<template>
  <v-menu
    :close-on-content-click="false"
    position="bottom left"
    width="600"
    open-on-hover
  >
    <template #activator="{ props: menu }">
      <v-chip
        :color="chip.color"
        :text="chip.text"
        size="small"
        variant="outlined"
        v-bind="menu"
        @click="checkConnection()"
      >
        <template #prepend>
          <div v-if="checkState" class="mr-2">
            <v-icon
              v-if="checkState === 'queued'"
              icon="mdi-dots-horizontal"
              size="small"
            />
            <v-progress-circular
              v-else
              size="14"
              width="2"
              indeterminate
            />
          </div>
          <v-icon v-else :icon="chip.icon" start />
        </template>
      </v-chip>
    </template>

    <SushiConnectionDetails :model-value="sushi?.connection">
      <template #actions>
        <v-btn
          :text="$t('institutions.sushi.checkCredentials')"
          :disabled="disabled"
          :loading="checkState"
          prepend-icon="mdi-connection"
          variant="text"
          color="primary"
          @click="checkConnection()"
        />
      </template>
    </SushiConnectionDetails>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  sushi: {
    type: Object,
    default: () => undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (value) => !!value,
});

const { t } = useI18n();
const checkQueue = useSushiCheckQueueStore();
const { idsInQueue, currentlyTesting, isTesting } = storeToRefs(checkQueue);

const status = computed(() => props.sushi?.connection?.status || 'untested');
const checkState = computed(() => {
  if (idsInQueue.value.has(props.sushi?.id)) {
    return 'queued';
  }
  if (currentlyTesting.value?.id === props.sushi?.id && isTesting.value) {
    return 'loading';
  }
  return undefined;
});
const chip = computed(() => {
  let text;
  switch (status.value) {
    case 'success':
      text = t('institutions.sushi.operational');
      break;
    case 'unauthorized':
      text = t('institutions.sushi.invalidCredentials');
      break;
    case 'failed':
      text = t('error');
      break;
    default:
      text = t('institutions.sushi.untested');
      break;
  }

  return {
    ...sushiStatus.get(status.value),
    text,
  };
});

function checkConnection() {
  if (!props.sushi || props.disabled || checkState.value) {
    return;
  }

  checkQueue.addToCheck(props.sushi, {
    onComplete: (err, connection) => {
      if (connection) {
        emit('update:modelValue', connection);
      }
    },
  });
}
</script>
