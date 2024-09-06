<template>
  <v-dialog
    v-model="isOpen"
    width="1100"
    scrollable
    persistent
  >
    <SpaceForm
      :model-value="space"
      :institution="institution"
      show-space
      @submit="onSave($event)"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </SpaceForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const isOpen = ref(false);
/** @type {Ref<object | undefined>} */
const space = ref(undefined);
/** @type {Ref<object | undefined>} */
const institution = ref(undefined);

async function open(s, opts) {
  space.value = s;
  institution.value = opts.institution;
  isOpen.value = true;
}

function onSave(s) {
  emit('submit', s);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
