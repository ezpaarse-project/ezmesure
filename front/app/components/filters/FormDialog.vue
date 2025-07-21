<template>
  <v-dialog
    v-model="isOpen"
    width="600"
    scrollable
    persistent
  >
    <FiltersForm
      v-model="filters"
      :title="title"
    >
      <template v-if="$slots.subtitle" #subtitle>
        <slot name="subtitle" />
      </template>

      <template #actions>
        <v-spacer />

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
    </FiltersForm>
  </v-dialog>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits({
  submit: (values) => true,
});

const isOpen = ref(false);
/** @type {Ref<object[] | undefined>} */
const filters = ref(undefined);

async function open(values) {
  filters.value = values;
  isOpen.value = true;
}

function onSave() {
  emit('submit', filters.value);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
