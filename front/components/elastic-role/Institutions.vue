<template>
  <v-card
    :title="$t('elasticRoles.institutions')"
    :subtitle="showRole ? role.name : undefined"
    prepend-icon="mdi-domain"
  >
    <template #append>
      <InstitutionAddMenu
        :model-value="institutions"
        :title="$t('elasticRoles.addInstitution')"
        @institution-add="addInstitution($event)"
      >
        <template #activator="{ props: menu }">
          <v-btn
            v-tooltip="$t('add')"
            icon="mdi-plus"
            variant="text"
            density="comfortable"
            color="green"
            v-bind="menu"
          />
        </template>
      </InstitutionAddMenu>
    </template>

    <template #text>
      <div v-if="institutions.length <= 0" class="text-center text-grey pt-5">
        {{ $t('elasticRoles.noInstitutions') }}
      </div>

      <v-list v-else density="compact" lines="two">
        <v-list-item
          v-for="institution in institutions"
          :key="institution.id"
          :title="institution.name"
          :subtitle="institution.acronym"
          :to="`/admin/institutions/${institution.id}`"
        >
          <template #prepend>
            <InstitutionAvatar :institution="institution" />
          </template>

          <template #append>
            <v-btn
              v-tooltip="$t('revoke')"
              icon="mdi-office-building-remove"
              variant="text"
              size="small"
              density="comfortable"
              color="red"
              @click.prevent="removeInstitution(institution)"
            />
          </template>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  role: {
    type: Object,
    required: true,
  },
  showRole: {
    type: Boolean,
    default: false,
  },
});

const snacks = useSnacksStore();
const { t } = useI18n();

const emit = defineEmits({
  'update:modelValue': () => true,
});

/** @type {Ref<object[]>} */
const institutions = ref(props.role.institutions || []);

async function addInstitution(item) {
  try {
    const updatedInstitution = await $fetch(`/api/institutions/${item.id}/elastic-roles/${props.role.name}`, {
      method: 'PUT',
      body: {},
    });
    institutions.value.push(updatedInstitution);
    emit('update:modelValue', institutions.value);
  } catch (err) {
    snacks.error(t('institutions.members.cannotAddMember'), err);
  }
}

async function removeInstitution(item) {
  try {
    await $fetch(`/api/institutions/${item.id}/elastic-roles/${props.role.name}`, {
      method: 'DELETE',
    });

    institutions.value = institutions.value.filter((institution) => institution.id !== item.id);

    emit('update:modelValue', institutions.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
}
</script>
