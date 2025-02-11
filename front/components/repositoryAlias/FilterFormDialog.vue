<template>
  <v-dialog
    v-model="isOpen"
    width="600"
    scrollable
    persistent
  >
    <RepositoryAliasFilterForm
      :alias="alias"
      :repository="repository"
      show-alias
      @[`update:alias.filters`]="alias.filters = $event"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />

        <v-btn
          :text="$t('save')"
          prepend-icon="mdi-content-save"
          variant="elevated"
          color="primary"
          @click="onSave()"
        />
      </template>
    </RepositoryAliasFilterForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const isOpen = ref(false);
/** @type {Ref<object | undefined>} */
const alias = ref(undefined);
/** @type {Ref<object | undefined>} */
const repository = ref(undefined);
/** @type {Ref<object | undefined>} */
const institution = ref(undefined);

async function open(a, opts) {
  alias.value = { ...a };
  repository.value = opts?.repository;
  institution.value = opts?.institution;
  isOpen.value = true;
}

function onSave() {
  emit('submit', alias.value);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
