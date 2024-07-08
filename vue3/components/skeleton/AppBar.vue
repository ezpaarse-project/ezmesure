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
      <div class="d-flex align-center ga-2">
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
      <div class="d-flex align-center ga-2 mr-2">
        <v-btn href="/kibana/" variant="text">
          {{ $t('menu.dashboard') }}
        </v-btn>
        <v-btn to="/myspace" variant="text">
          {{ $t('menu.myspace') }}
        </v-btn>
        <v-btn v-if="user?.isAdmin" to="/admin" variant="text">
          {{ $t('administration') }}
        </v-btn>
        <SkeletonLangSwitch />
      </div>
    </template>
  </v-app-bar>
</template>

<script setup>
import logo from '@/static/images/logo.png';

const { public: config } = useRuntimeConfig();
const { data: user } = useAuthState();

const currentInstance = computed(() => config.currentInstance);
</script>

<style scoped lang="scss">
.current-instance {
  font-size: 0.5em !important;
  text-align: center;
  line-height: normal;
}
</style>
