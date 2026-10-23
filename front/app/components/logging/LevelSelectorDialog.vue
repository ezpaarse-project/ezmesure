<template>
  <v-dialog
    v-model="show"
    :width="500"
    scrollable
  >
    <v-card
      :title="title"
      :loading="updatingLevel"
    >
      <template #text>
        <v-form
          id="levelForm"
          v-model="formIsValid"
          class="mt-2"
          @submit.prevent="setLoggingLevel()"
        >
          <v-select
            v-model="loggingLevel"
            :items="availableLevels"
            :loading="fetchingLoggingData"
            :label="$t('admin.logs.actions.level.level')"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            density="compact"
            variant="outlined"
          />

          <v-select
            v-model="durationSeconds"
            :hint="$t('admin.logs.actions.level.durationHint')"
            :items="availableDurations"
            :label="$t('admin.logs.actions.level.duration')"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            item-title="text"
            item-value="value"
            density="compact"
            variant="outlined"
            persistent-hint
          />
        </v-form>
      </template>

      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="show = false"
        />
        <v-btn
          :disabled="!formIsValid || fetchingLoggingData"
          :loading="updatingLevel"
          :text="$t('update')"
          color="primary"
          form="levelForm"
          type="submit"
          variant="flat"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { intervalToDuration } from 'date-fns';

const props = defineProps({
  title: {
    type: String,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: undefined,
  },
});

const snacks = useSnacksStore();
const { t, locale } = useI18n();

const show = defineModel({ type: Boolean, default: false });

const title = computed(() => props.title ?? t('admin.logs.actions.level.title'));

const durationPresets = [60, 600, 1800, 3600, 3600 * 24];

const availableDurations = computed(() => {
  const durationFormatter = new Intl.DurationFormat(locale.value, { style: 'long' });

  return durationPresets.map((nbSeconds) => ({
    value: nbSeconds,
    text: durationFormatter.format(intervalToDuration({ start: 0, end: nbSeconds * 1000 })),
  }));
});

const {
  data: loggingData,
  pending: fetchingLoggingData,
  refresh: refreshLoggingData,
} = await useFetch('/api/config/logging', { lazy: true });

const availableLevels = computed(() => loggingData.value?.levels ?? []);
const updatingLevel = shallowRef(false);

const loggingLevel = shallowRef('');
const durationSeconds = shallowRef(600);
const formIsValid = shallowRef(false);

whenever(loggingData, () => {
  loggingLevel.value = loggingData.value?.level ?? '';
});

whenever(show, () => {
  refreshLoggingData();
});

const setLoggingLevel = async () => {
  updatingLevel.value = true;
  try {
    await $fetch('/api/config/logging/level', {
      method: 'PUT',
      body: {
        value: loggingLevel.value,
        duration: durationSeconds.value,
      },
    });
    show.value = false;
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
  updatingLevel.value = false;
};
</script>
