<template>
  <div class="mx-2">
    <!-- Desktop menu -->
    <div class="d-none d-md-flex align-center ga-2">
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            :text="$t('menu.documentation')"
            v-bind="props"
            variant="text"
            append-icon="mdi-chevron-down"
          />
        </template>

        <v-list>
          <v-list-item
            href="https://docs.readmetrics.org/s/fr-ezmesure-user"
            target="_blank"
            rel="noopener noreferrer"
            prepend-icon="mdi-book-open"
            slim
          >
            {{ $t('menu.users') }}
          </v-list-item>
          <v-list-item
            to="/api-reference"
            :title="$t('menu.api')"
            prepend-icon="mdi-code-tags"
            slim
          />
        </v-list>
      </v-menu>

      <template v-for="item in items">
        <v-spacer v-if="item.separator" :key="item.key" />

        <v-btn
          v-else
          :key="item.key || item.to || item.href"
          :to="item.to"
          :href="item.href"
          :text="item.text"
          :exact="item.exact"
          :target="item.target"
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
          <v-list-subheader>{{ t('menu.documentation') }}</v-list-subheader>
          <v-list-item
            href="https://docs.readmetrics.org/s/fr-ezmesure-user"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('menu.users') }}
          </v-list-item>
          <v-list-item
            :to="'/api-reference'"
            :title="$t('menu.api')"
          />
          <v-divider />
          <template v-for="item in items">
            <v-divider v-if="item.separator" :key="item.key" />

            <v-list-item
              v-else
              :key="item.key || item.to || item.href"
              :to="item.to"
              :href="item.href"
              :text="item.text"
              :exact="item.exact"
              :target="item.target"
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
  { text: t('menu.contact'), to: '/contact-us', exact: true },
  { separator: true, key: 'menu-separator' },
  {
    text: t('menu.dashboard'),
    href: '/kibana/',
    exact: true,
    target: '_blank',
  },
  { text: t('menu.myspace'), to: '/myspace/' },
  { text: t('administration'), to: '/admin/', hide: !user.value?.isAdmin },
].filter((item) => !item.hide));
</script>
