<template>
  <v-app-bar color="primary" app fixed clipped-left>
    <template #prepend>
      <NuxtLink
        :title="$t('menu.homepage')"
        :aria-label="$t('menu.homepage')"
        to="/"
        class="pl-4"
      >
        <v-img
          :src="logo"
          alt="Logo ezMESURE"
          contain
          transition="scale-transition"
          height="38px"
          width="38px"
        />
      </NuxtLink>
    </template>

    <v-app-bar-title>
      <div class="d-flex align-center">
        <div class="mr-4">
          ezMESURE

          <div
            v-if="currentInstance"
            class="text-overline current-instance"
          >
            {{ currentInstance }}
          </div>
        </div>

        <v-btn exact to="/partners" variant="text">
          {{ $t('menu.partners') }}
        </v-btn>
        <v-btn exact to="/api-reference" variant="text">
          {{ $t('menu.api') }}
        </v-btn>
        <v-btn exact to="/contact-us" variant="text">
          {{ $t('menu.contact') }}
        </v-btn>
      </div>
    </v-app-bar-title>

    <template #append>
      <v-btn href="/kibana/" variant="text">
        {{ $t('menu.dashboard') }}
      </v-btn>
      <v-btn to="/myspace" variant="text">
        {{ $t('menu.myspace') }}
      </v-btn>
      <!-- <v-btn v-if="isAdmin" text to="/admin">
        {{ $t('administration') }}
      </v-btn> -->
      <SkeletonLangSwitch />
    </template>

    <!-- <v-app-bar-nav-icon dark @click.stop="updateVisibleMenu()" /> -->
  </v-app-bar>
</template>

<script setup lang="ts">
import logo from '@/static/images/logo.png';

const runtimeConfig = useRuntimeConfig();

// const emit = defineEmits<{
//   (e: 'modelValue:menu'): void
// }>();

const currentInstance = computed(() => runtimeConfig.public.currentInstance);

// async function updateVisibleMenu() {
//   emit('modelValue:menu');
// };
</script>

<style scoped lang="scss">
.current-instance {
  font-size: 0.5em !important;
  text-align: center;
  line-height: normal;
}
</style>
