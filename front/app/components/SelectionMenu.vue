<template>
  <v-menu v-model="open" location="top">
    <template #activator="{ props: menu }">
      <v-slide-y-reverse-transition>
        <v-btn
          v-show="modelValue.length > 0"
          :text="text"
          :prepend-icon="open ? 'mdi-chevron-down' : 'mdi-chevron-up'"
          color="primary"
          position="fixed"
          location="bottom right"
          size="large"
          :style="{
            bottom: hasSnackMessages ? '4rem' : '1rem',
            right: '1rem',
            transition: 'bottom .3s ease',
          }"
          v-bind="menu"
        />
      </v-slide-y-reverse-transition>
    </template>

    <v-list>
      <slot name="actions" />

      <v-divider v-if="$slots.actions" />

      <v-list-item
        :title="$t('deselect')"
        prepend-icon="mdi-close"
        @click="$emit('update:modelValue', [])"
      />
    </v-list>
  </v-menu>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  text: {
    type: String,
    default: '',
  },
});

defineEmits({
  'update:modelValue': (selection) => selection.length >= 0,
});

const open = shallowRef(false);
const snacks = useSnacksStore();

const hasSnackMessages = computed(() => snacks.messages.length > 0);
</script>
