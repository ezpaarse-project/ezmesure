<template>
  <v-app-bar color="primary" app fixed clipped-left>
    <template #prepend>
      <nuxt-link
        :title="$t('menu.bar.homepage')"
        :aria-label="$t('menu.bar.homepage')"
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
      </nuxt-link>
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

        <SkeletonAppMenu class="flex-fill" />
      </div>
    </v-app-bar-title>
  </v-app-bar>
</template>

<script setup>
import logo from '@@/static/images/logo.png';

const { public: config } = useRuntimeConfig();

const currentInstance = computed(() => config.currentInstance);
</script>

<style scoped lang="scss">
.current-instance {
  font-size: 0.5em !important;
  text-align: center;
  line-height: normal;
}
</style>
