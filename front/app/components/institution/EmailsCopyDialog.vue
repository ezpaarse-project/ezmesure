<template>
  <v-dialog
    v-model="isOpen"
    max-width="600"
    scrollable
  >
    <v-card
      :title="$t('institutions.members.createMailList')"
      :subtitle="allInstitutions ? $t('institutions.all') : $t('institutions.count', { count: institutionIds.size })"
    >
      <RolePicker
        v-model="selectedRoles"
        flat
        hide-search
        class="overflow-auto"
      />

      <template #actions>
        <v-progress-circular
          v-if="loadingEmails"
          indeterminate
          color="primary"
          size="16"
          width="2"
        />
        <div v-else>
          {{ t('nSelected', { count: selectedEmails.size }) }}
        </div>

        <v-spacer />

        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />

        <v-btn
          :text="$t('copy')"
          :disabled="loadingEmails || selectedEmails.size === 0"
          prepend-icon="mdi-content-copy"
          variant="elevated"
          color="primary"
          @click="copyEmails()"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
const { copy } = useClipboard();

const { t } = useI18n();
const snacks = useSnacksStore();

const isOpen = shallowRef(false);

const institutionIds = ref(new Set());
const selectedRoles = ref([]);

const allInstitutions = computed(() => institutionIds.value.size === 0);

const {
  data: roles,
  status,
} = useAsyncData(`roles-${Array.from(selectedRoles.value)}`, async () => {
  if (selectedRoles.value.length <= 0) {
    return [];
  }

  try {
    return await $fetch('/api/rolses', {
      query: {
        id: selectedRoles.value,
        include: ['membershipRoles.membership.user'],
        size: 0,
      },
    });
  } catch (e) {
    snacks.error(t('anErrorOccurred'), e);
    throw e;
  }
}, {
  lazy: true,
  immediate: false,
  dedupe: 'defer',
  watch: [selectedRoles],
});

const loadingEmails = computed(() => status.value === 'pending');

const selectedEmails = computed(() => new Set(
  (roles.value ?? [])
    .flatMap((role) => role?.membershipRoles ?? [])
    .filter((mr) => (
      allInstitutions.value || institutionIds.value.has(mr?.membership?.institutionId)
    ))
    .map((mr) => mr?.membership?.user?.email),
));

async function copyEmails() {
  try {
    await copy(Array.from(selectedEmails.value).join('; '));
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('emailsCopied'));
}

async function open(ids) {
  institutionIds.value = new Set(ids ?? []);
  isOpen.value = true;
}

defineExpose({
  open,
});
</script>
