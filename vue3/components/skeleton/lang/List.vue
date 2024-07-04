<template>
  <v-list>
    <v-list-item 
      v-for="lang in langs"
      :key="lang.locale"
      :title="lang.language"
      @click="i18n.setLocale(lang.locale)"
    >
      <template #prepend>
        <img width="24" class="mr-2" :src="lang.pathImage" :alt="lang.locale" >
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { langs } from '@/config/i18n'

const i18n = useI18n()
</script>
