<template>
  <v-card>
    <v-list
      class="py-1"
      rounded="lg"
    >
      <v-list-item :title="text">
        <template #append>
          <v-progress-circular
            :color="color"
            indeterminate="disable-shrink"
            size="16"
            width="2"
          />
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
const { text: propsText } = defineProps({
  text: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'primary',
  },
});

const { t } = useI18n();

const text = computed(() => propsText || t('loading'));
</script>
