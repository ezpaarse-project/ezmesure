<template>
  <v-dialog
    v-model="isOpen"
    width="800"
    scrollable
    persistent
  >
    <MembershipForm
      ref="membershipFormRef"
      :model-value="membership"
      :institution="institution"
      @update:model-value="onSave"
    >
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </MembershipForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

const isOpen = ref(false);
/** @type {Ref<object | undefined>} */
const membership = ref(undefined);
/** @type {Ref<object | undefined>} */
const institution = ref(undefined);

/** @type {Ref<object | null>} Vue ref of the membership form */
const membershipFormRef = ref(null);

async function open(m, opts) {
  membership.value = m;
  institution.value = opts.institution;
  isOpen.value = true;
}

function onSave() {
  emit('update:modelValue', membership.value);
}

defineExpose({
  open,
});
</script>
