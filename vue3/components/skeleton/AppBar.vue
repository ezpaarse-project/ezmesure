<template>
  <v-app-bar app dark fixed clipped-left color="primary">
    <v-app-bar-nav-icon dark @click.stop="updateVisibleMenu($event)" />
    <v-toolbar-title> {{ title }} </v-toolbar-title>
    <v-spacer />
  </v-app-bar>
</template>

<script setup>

import { computed } from 'vue';

const runtimeConfig = useRuntimeConfig()

const i18n = useI18n()

const title = computed(() => {
  if (runtimeConfig.public.environment === 'integration') {
    return `App ${i18n.t('integration')}`
  }
  if (runtimeConfig.public.environment === 'production') {
    return 'App'
  }
  return `App ${i18n.t('development')}`
});

const emit = defineEmits({
  menuUpdate: undefined
})
  
async function updateVisibleMenu() {
  emit('menuUpdate');
};


</script>
