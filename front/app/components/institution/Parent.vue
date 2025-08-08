<template>
  <v-card :title="$t('group.group')" prepend-icon="mdi-home-city">
    <template #text>
      <InstitutionAutoComplete
        :model-value="parent"
        @update:model-value="$event ? linkParent($event) : unlinkParent()"
      />
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (item) => item !== null,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const isLinkLoading = shallowRef(false);
/** @type {Ref<object|null>} */
const parent = ref(props.institution.parentInstitution);

function init(item) {
  parent.value = item;
}

async function unlinkParent() {
  try {
    await $fetch(`/api/institutions/${parent.value.id}/subinstitutions/${props.institution.id}`, {
      method: 'DELETE',
    });

    parent.value = undefined;

    emit('update:modelValue', parent.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
}

async function linkParent(item) {
  if (!item || !props.institution || item.id === props.institution.id) {
    return;
  }

  isLinkLoading.value = true;
  try {
    await $fetch(`/api/institutions/${item.id}/subinstitutions/${props.institution.id}/`, {
      method: 'PUT',
      body: { type: props.institution.type },
    });

    parent.value = { ...item };

    emit('update:modelValue', parent.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
  isLinkLoading.value = false;
}

defineExpose({
  init,
});
</script>
