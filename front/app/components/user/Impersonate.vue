<template>
  <v-card
    :title="$t('authenticate.impersonate.title')"
    :subtitle="showUser ? user.fullName : undefined"
    :loading="loadingTestUsers && 'primary'"
    prepend-icon="$mdi-account"
  >
    <template #append>
      <v-scale-transition>
        <v-btn
          v-if="windowId === 'kibana'"
          v-tooltip:left="$t('refresh')"
          icon="$mdi-reload"
          variant="text"
          @click="refresh()"
        />
      </v-scale-transition>
    </template>

    <template #text>
      <p>{{ $t('authenticate.impersonate.text.intro') }}</p>

      <i18n-t tag="p" keypath="authenticate.impersonate.text.session" class="font-weight-bold">
        <template #duration>
          {{ impersonateDuration }}
        </template>
      </i18n-t>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="$t('authenticate.impersonate.actions.agree')"
        :loading="impersonating"
        prepend-icon="$mdi-login"
        size="small"
        color="primary"
        @click="impersonateUser()"
      />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  showUser: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit']);

const { t, locale } = useI18n();
const snacks = useSnacksStore();
const authStore = useAuthStore();
const { data: apiConfig } = await useApiConfig();

const impersonating = shallowRef(false);

const impersonateDuration = computed(() => {
  if (!apiConfig.value) {
    return t('authenticate.impersonate.text.defaultDuration');
  }
  // Impersonate duration is in seconds
  return timeAgo(apiConfig.value.users.impersonateDuration * 1000, locale.value);
});

async function impersonateUser() {
  impersonating.value = true;

  try {
    await $fetch(`/api/users/${props.user.username}/_impersonate`, { method: 'POST' });
    await authStore.refreshAuthenticatedUser();
    emit('submit');
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
    return;
  } finally {
    impersonating.value = false;
  }

  await navigateTo('/myspace');
}
</script>
