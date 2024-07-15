<template>
  <div class="mx-2">
    <!-- Desktop menu -->
    <div class="d-none d-md-flex align-center ga-2">
      <template v-for="item in items">
        <v-spacer v-if="item.separator" :key="item.key" />

        <v-btn
          v-else
          :key="item.key || item.to"
          :to="item.to"
          :text="item.text"
          :exact="item.exact"
          variant="text"
        />
      </template>

      <SkeletonLangMenu>
        <template #activator="{ props, currentLang, isOpen }">
          <v-btn
            :append-icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :text="currentLang"
            v-bind="props"
          />
        </template>
      </SkeletonLangMenu>
    </div>

    <!-- Mobile menu -->
    <div class="d-flex d-md-none align-center">
      <v-spacer />

      <SkeletonLangMenu>
        <template #activator="{ props, currentLang, isOpen }">
          <v-btn
            :append-icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :text="currentLang"
            v-bind="props"
          />
        </template>
      </SkeletonLangMenu>

      <v-bottom-sheet>
        <template #activator="{ props }">
          <v-btn
            icon="mdi-menu"
            variant="text"
            v-bind="props"
          />
        </template>

        <v-list>
          <template v-for="item in items">
            <v-divider v-if="item.separator" :key="item.key" />

            <v-list-item
              v-else
              :key="item.to || item.key"
              :to="item.to"
              :text="item.text"
              :exact="item.exact"
            />
          </template>
        </v-list>
      </v-bottom-sheet>
    </div>
  </div>
</template>

<script setup>
const { t } = useI18n();
const { data: user } = useAuthState();

const items = computed(() => [
  { text: t('menu.partners'), to: '/partners', exact: true },
  { text: t('menu.api'), to: '/api-reference', exact: true },
  { text: t('menu.contact'), to: '/contact-us', exact: true },

  { separator: true, key: 'menu-separator' },

  { text: t('menu.dashboard'), to: '/kibana/', exact: true },
  { text: t('menu.myspace'), to: '/myspace/' },
  { text: t('administration'), to: '/admin/', hide: !user.value?.isAdmin },
].filter((item) => !item.hide));
</script>
