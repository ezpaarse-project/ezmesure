<template>
  <section>
    <p class="text-center ma-2" v-html="t('link', { githubProfileURL })" />
    <GithubButtonRequest />
  </section>
</template>

<script setup>

import GithubButtonRequest from '@/components/home/GithubButtonRequest.vue';

const { t } = useI18n()
const runtimeConfig = useRuntimeConfig()

const githubProfileURL = ref(runtimeConfig.public.githubProfileURL);

</script>