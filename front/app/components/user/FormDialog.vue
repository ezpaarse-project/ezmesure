<template>
  <v-dialog
    v-model="show"
    width="800"
    scrollable
    persistent
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
            @click="show = false"
          />

          <v-btn
            :text="$t('retry')"
            :loading="loading"
            variant="elevated"
            color="secondary"
            @click="refresh"
          />
        </template>
      </v-empty-state>
    </v-card>

    <UserForm
      v-else
      :model-value="userData"
      show-user
      @submit="onSave($event)"
    >
      <template #actions="{ loading: formLoading }">
        <v-btn
          :text="$t('cancel')"
          :disabled="formLoading"
          variant="text"
          @click="show = false"
        />
      </template>
    </UserForm>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const emit = defineEmits({
  submit: (item) => !!item,
});

const props = defineProps({
  username: {
    type: String,
    default: undefined,
  },
});

const show = defineModel({ type: Boolean, default: false });

const {
  data: userData,
  status,
  error,
  refresh,
} = await useAsyncData(computed(() => `user-${props.username}`), async (_nuxtApp, { signal }) => {
  if (!props.username) {
    return undefined;
  }

  return $fetch(`/api/users/${props.username}`, { signal });
}, {
  lazy: true,
  dedupe: 'defer',
});

const loading = computed(() => status.value === 'pending');
const errorMessage = computed(() => (error.value ? getErrorMessage(error.value) : undefined));
const errorIcon = computed(() => (error?.value?.statusCode === 404 ? 'mdi-ghost-outline' : 'mdi-alert-circle'));

function onSave(s) {
  emit('submit', s);
  show.value = false;
}
</script>
