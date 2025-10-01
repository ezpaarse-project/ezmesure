<template>
  <v-dialog
    :model-value="isOpen"
    width="600"
    @update:model-value="close()"
  >
    <LoaderCard v-if="loading" />

    <v-card v-else-if="errorMessage">
      <v-empty-state
        :icon="errorIcon"
        :title="errorMessage"
      >
        <template #actions>
          <v-btn
            :text="$t('close')"
            variant="text"
            @click="isOpen = false"
          />

          <v-btn
            :text="$t('retry')"
            :loading="loading"
            variant="elevated"
            color="secondary"
            @click="refreshForm"
          />
        </template>
      </v-empty-state>
    </v-card>

    <InstitutionSpaces
      v-else
      :institution="institution"
      show-institution
      @update:model-value="hasChanged = true"
    >
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="close()"
        />
      </template>
    </InstitutionSpaces>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const emit = defineEmits({
  'update:modelValue': () => true,
});

const isOpen = shallowRef(false);
const hasChanged = shallowRef(false);
/** @type {Ref<object|null>} */
const institution = ref(null);
const loading = shallowRef(false);
const errorMessage = shallowRef('');
const errorIcon = shallowRef('');

async function open(i) {
  institution.value = i;
  hasChanged.value = false;
  isOpen.value = true;

  if (!i.spaces) {
    loading.value = true;
    errorMessage.value = '';
    errorIcon.value = '';

    try {
      institution.value.spaces = await $fetch(`/api/institutions/${i.id}/spaces`);
    } catch (err) {
      errorMessage.value = getErrorMessage(err, t('anErrorOccurred'));
      errorIcon.value = err?.statusCode === 404 ? 'mdi-file-hidden' : 'mdi-alert-circle';
    }
    loading.value = false;
  }
}

function close() {
  if (hasChanged.value) {
    emit('update:modelValue');
  }
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
