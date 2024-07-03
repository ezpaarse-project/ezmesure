<template>
  <v-list nav dense>
    <v-list-item v-for="route in routers" link router :to="{ path: route.path }" ripple :title="route.text">
      <template v-slot:prepend>
        <v-icon :icon="route.icon"></v-icon>
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup>

import { computed } from 'vue';

const { t } = useI18n()

const routers = computed(() => {
  return [
    { text: t('menu.home'), icon: 'mdi-view-dashboard', path: '/', },
    { text: t('menu.first'), icon: 'mdi-code-json', path: '/page1', },
    { text: t('menu.second'), icon: 'mdi-server', path: '/page2', },
  ]
})

</script>