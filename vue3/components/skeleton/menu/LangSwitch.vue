<template>
  <v-list v-model:opened="open">
    <v-list-group value="Lang">
      <template v-slot:activator="{ props }">
        <v-list-item v-bind="props" :title="t('language')"></v-list-item>
      </template>

      <LangList />
    </v-list-group>
  </v-list>
</template>

<script setup>

import { ref } from 'vue'
const { t } = useI18n()

import LangList from '@/components/skeleton/menu/LangList.vue'

const open = ref(['Lang']);

</script>
